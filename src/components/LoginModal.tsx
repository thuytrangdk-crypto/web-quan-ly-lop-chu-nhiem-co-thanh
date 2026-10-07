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
} from 'lucide-react';

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

  // Student login state
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

  const handleStudentSubmit = (e: React.FormEvent) => {
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

    const expectedPass = student.password || '123';
    // If student has a password and input is given, check it
    if (studentInputPass && studentInputPass.trim() !== expectedPass.trim()) {
      setStudentError('Mật khẩu học sinh không đúng! (Mặc định: 123)');
      return;
    }

    onLoginStudent(selectedStudentId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
        {/* Header banner */}
        <div className="bg-linear-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white p-7 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-28 h-28 bg-violet-400/20 rounded-full blur-lg pointer-events-none" />

          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
            <GraduationCap className="w-8 h-8 text-amber-300" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            {appName || 'Sổ Chủ Nhiệm Điện Tử'}
          </h2>
          <p className="text-xs text-indigo-100/90 mt-1 font-medium">
            Hệ thống Quản lý Nề nếp & Học tập Lớp học Toàn diện
          </p>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/20 backdrop-blur-md rounded-2xl mt-5 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setActiveTab('teacher');
                setTeacherError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'teacher'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-indigo-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Giáo Viên</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setStudentError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-indigo-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Học Sinh / Phụ Huynh</span>
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-7">
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
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    Điền nhanh 123
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Đăng nhập quyền Quản lý</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Chọn Học sinh
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
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setStudentError('');
                  }}
                  className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  {filteredStudents.length === 0 ? (
                    <option value="">Không tìm thấy học sinh</option>
                  ) : (
                    filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.position || 'Học sinh'}) - Mã: {s.id}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Mật khẩu Học sinh (Tùy chọn)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={studentInputPass}
                    onChange={(e) => {
                      setStudentInputPass(e.target.value);
                      setStudentError('');
                    }}
                    placeholder="Mật khẩu (Mặc định: 123 hoặc bỏ trống)"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                {studentError && (
                  <p className="text-xs text-rose-600 font-semibold mt-2">
                    {studentError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Xem Hồ sơ Cá nhân</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
