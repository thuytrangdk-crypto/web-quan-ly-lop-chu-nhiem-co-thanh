import React, { useState } from 'react';
import { Student } from '../types';
import {
  GraduationCap,
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  Sparkles,
  KeyRound,
  Search,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  checkStudentPassword,
  findStudentsByAccountOrDob,
  formatViDate,
} from '../utils/helpers';

interface LoginModalProps {
  appName: string;
  teacherPassword?: string;
  students: Student[];
  onLoginTeacher: () => void;
  onLoginStudent: (studentId: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  appName,
  teacherPassword = '123',
  students,
  onLoginTeacher,
  onLoginStudent,
}) => {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');

  // Teacher login state
  const [teacherInputPass, setTeacherInputPass] = useState('');
  const [teacherError, setTeacherError] = useState('');

  // Student login mode: 'dob' (Account = DOB, Pass = DOB) or 'list' (Select name)
  const [studentLoginMode, setStudentLoginMode] = useState<'dob' | 'list'>('dob');

  // Student direct DOB account login state
  const [studentAccountDob, setStudentAccountDob] = useState('');
  const [studentDobPass, setStudentDobPass] = useState('');

  // Student select list login state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [studentSearch, setStudentSearch] = useState('');
  const [studentInputPass, setStudentInputPass] = useState('');
  const [studentError, setStudentError] = useState('');

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.id.includes(studentSearch)
  );

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherInputPass) {
      setTeacherError('Vui lòng nhập mật khẩu giáo viên');
      return;
    }
    if (teacherInputPass.trim() === teacherPassword.trim()) {
      onLoginTeacher();
    } else {
      setTeacherError('Mật khẩu không chính xác! (Mặc định: 123)');
    }
  };

  const handleStudentDobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    const accountQuery = studentAccountDob.trim();
    const passQuery = studentDobPass.trim();

    if (!accountQuery) {
      setStudentError('Vui lòng nhập Tài khoản (Ngày sinh của em, VD: 15/05/2012)');
      return;
    }
    if (!passQuery) {
      setStudentError('Vui lòng nhập Mật khẩu (Ngày sinh của em, VD: 15/05/2012)');
      return;
    }

    // Tìm học sinh theo tài khoản / ngày sinh
    const matched = findStudentsByAccountOrDob(accountQuery, students);

    if (matched.length === 0) {
      setStudentError(
        'Không tìm thấy học sinh với ngày sinh/tài khoản này! Em có thể bấm "Chọn tên từ danh sách lớp" bên dưới.'
      );
      return;
    }

    if (matched.length === 1) {
      const student = matched[0];
      const isOk = checkStudentPassword(passQuery, student);
      if (!isOk) {
        setStudentError('Mật khẩu không đúng! Mật khẩu là ngày sinh của em.');
        return;
      }
      onLoginStudent(student.id);
      return;
    }

    // Có nhiều bạn cùng ngày sinh -> kiểm tra xem bạn nào khớp mật khẩu
    const validStudent = matched.find((s) => checkStudentPassword(passQuery, s));
    if (validStudent) {
      onLoginStudent(validStudent.id);
    } else {
      setStudentError(
        `Lớp có ${matched.length} bạn có ngày sinh này (${matched.map((m) => m.name).join(', ')}). Vui lòng chuyển sang tab "Chọn tên từ danh sách" để đăng nhập chính xác!`
      );
    }
  };

  const handleStudentListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setStudentError('Vui lòng chọn học sinh');
      return;
    }
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) {
      setStudentError('Học sinh không tồn tại');
      return;
    }

    const isOk = checkStudentPassword(studentInputPass, student);
    if (!isOk) {
      setStudentError(
        `Mật khẩu không đúng! Mật khẩu là ngày sinh của em (VD: ${formatViDate(student.dob) || '15/05/2012'} hoặc 123)`
      );
      return;
    }

    onLoginStudent(selectedStudentId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-200/80 flex flex-col">
        {/* Header banner với tông màu hồng phấn nhạt nhẹ nhàng, thanh lịch như mẫu */}
        <div className="bg-linear-to-b from-[#fdf2f4] via-[#fce8ed] to-[#fadce4] text-gray-900 p-6 sm:p-7 text-center relative overflow-hidden border-b border-pink-200/70">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/40 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-28 h-28 bg-pink-300/20 rounded-full blur-lg pointer-events-none" />

          {/* Biểu tượng hình nón tú tài trên nền hồng phấn */}
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white text-pink-600 shadow-sm border border-pink-200/80 flex items-center justify-center ring-2 ring-pink-100/80">
            <GraduationCap className="w-8 h-8 text-pink-600 stroke-[2.2]" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-gray-900">
            {appName || 'Sổ Chủ Nhiệm Điện Tử'}
          </h2>
          <p className="text-xs text-gray-600 mt-1 font-medium">
            Hệ thống Quản lý Nề nếp & Học tập Lớp học Toàn diện
          </p>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/70 backdrop-blur-md rounded-2xl mt-5 border border-pink-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('teacher');
                setTeacherError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-white text-pink-800 shadow-xs border border-pink-200/60'
                  : 'text-gray-600 hover:text-pink-700 hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-pink-600" />
              <span>Giáo Viên</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setStudentError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white text-pink-800 shadow-xs border border-pink-200/60'
                  : 'text-gray-600 hover:text-pink-700 hover:bg-white/50'
              }`}
            >
              <User className="w-3.5 h-3.5 text-pink-600" />
              <span>Học Sinh / Phụ Huynh</span>
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-7 bg-[#fffbfa]">
          {activeTab === 'teacher' ? (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Mật khẩu Quản lý Giáo viên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={teacherInputPass}
                    onChange={(e) => {
                      setTeacherInputPass(e.target.value);
                      setTeacherError('');
                    }}
                    placeholder="Nhập mật khẩu (Mặc định: 123)"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-pink-200/80 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all shadow-xs"
                    autoFocus
                  />
                </div>
                {teacherError && (
                  <p className="text-xs text-rose-600 font-semibold mt-2">
                    {teacherError}
                  </p>
                )}
                <div className="mt-2.5 flex items-center justify-between text-xs text-gray-400">
                  <span>Mật khẩu mặc định: <strong className="text-gray-700">123</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setTeacherInputPass('123');
                    }}
                    className="text-pink-600 hover:underline font-semibold cursor-pointer"
                  >
                    Điền nhanh 123
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-linear-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-md shadow-pink-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Đăng nhập quyền Quản lý</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Lời nhắc quan trọng: Tài khoản và mật khẩu là ngày sinh */}
              <div className="p-3 bg-pink-50/80 border border-pink-200/70 rounded-2xl text-[11.5px] text-pink-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-pink-800">
                  <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                  <span>Quy định đăng nhập học sinh:</span>
                </div>
                <p className="leading-relaxed">
                  Tài khoản và Mật khẩu của mỗi học sinh chính là <strong>ngày tháng năm sinh</strong> của em do cô chủ nhiệm đưa lên kèm danh sách (Ví dụ: sinh ngày 15/05/2012 thì Tài khoản và Mật khẩu là <strong>15/05/2012</strong> hoặc <strong>15052012</strong>).
                </p>
              </div>

              {/* Mode switch: Nhập ngày sinh trực tiếp hoặc chọn từ danh sách */}
              <div className="flex rounded-xl bg-pink-100/50 p-1 border border-pink-200/60 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStudentLoginMode('dob');
                    setStudentError('');
                  }}
                  className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
                    studentLoginMode === 'dob'
                      ? 'bg-white text-pink-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Nhập Tài khoản (Ngày sinh)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentLoginMode('list');
                    setStudentError('');
                  }}
                  className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
                    studentLoginMode === 'list'
                      ? 'bg-white text-pink-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Chọn tên từ danh sách
                </button>
              </div>

              {studentLoginMode === 'dob' ? (
                /* Cách 1: Đăng nhập trực tiếp bằng ngày sinh */
                <form onSubmit={handleStudentDobSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-pink-600" />
                      <span>Tài khoản Học sinh (Ngày sinh)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={studentAccountDob}
                        onChange={(e) => {
                          setStudentAccountDob(e.target.value);
                          setStudentError('');
                        }}
                        placeholder="VD: 15/05/2012 hoặc 15052012"
                        className="w-full px-3.5 py-2.5 bg-white border border-pink-200 rounded-xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500 shadow-2xs"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-pink-600" />
                      <span>Mật khẩu (Ngày sinh của em)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={studentDobPass}
                        onChange={(e) => {
                          setStudentDobPass(e.target.value);
                          setStudentError('');
                        }}
                        placeholder="VD: 15/05/2012 hoặc 15052012"
                        className="w-full px-3.5 py-2.5 bg-white border border-pink-200 rounded-xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500 shadow-2xs"
                      />
                    </div>
                    {/* Nút bấm tự sao chép ngày sinh vào mật khẩu */}
                    {studentAccountDob && (
                      <button
                        type="button"
                        onClick={() => setStudentDobPass(studentAccountDob)}
                        className="mt-1 text-[11px] text-pink-600 hover:underline font-semibold cursor-pointer"
                      >
                        Mật khẩu giống tài khoản: Dùng ngày sinh trên
                      </button>
                    )}
                  </div>

                  {studentError && (
                    <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                      {studentError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-linear-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-md shadow-pink-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Đăng nhập vào Hồ sơ</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              ) : (
                /* Cách 2: Chọn tên từ danh sách lớp */
                <form onSubmit={handleStudentListSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Chọn Học sinh trong lớp
                    </label>
                    {students.length > 5 && (
                      <div className="relative mb-2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Search className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="Tìm theo tên học sinh..."
                          className="w-full pl-9 pr-3 py-2 bg-white border border-pink-200/80 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-pink-400"
                        />
                      </div>
                    )}
                    <select
                      value={selectedStudentId}
                      onChange={(e) => {
                        setSelectedStudentId(e.target.value);
                        setStudentError('');
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-pink-200/80 rounded-xl text-sm font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-pink-400 transition-all"
                    >
                      {filteredStudents.length === 0 ? (
                        <option value="">Không tìm thấy học sinh</option>
                      ) : (
                        filteredStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.position || 'Học sinh'}) - Ngày sinh: {formatViDate(s.dob)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-pink-600" />
                      <span>Mật khẩu (Ngày tháng năm sinh)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={studentInputPass}
                        onChange={(e) => {
                          setStudentInputPass(e.target.value);
                          setStudentError('');
                        }}
                        placeholder="Nhập ngày sinh (VD: 15/05/2012)"
                        className="w-full px-3.5 py-2.5 bg-white border border-pink-200/80 rounded-xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-pink-400 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {studentError && (
                    <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                      {studentError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-linear-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-md shadow-pink-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Xem Hồ sơ Cá nhân</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
