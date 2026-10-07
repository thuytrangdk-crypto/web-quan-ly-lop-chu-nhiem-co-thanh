import React from 'react';
import {
  Menu,
  GraduationCap,
  Cloud,
  CloudCheck,
  CloudAlert,
  KeyRound,
  User,
  LogOut,
  ChevronDown,
  Layers,
  Calendar,
  School,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { SyncStatus } from '../services/supabaseService';

interface HeaderProps {
  title: string;
  className: string;
  schoolName?: string;
  schoolYear?: string;
  teacherName: string;
  isTeacher: boolean;
  studentName?: string;
  syncStatus: SyncStatus;
  onOpenMobileSidebar: () => void;
  onOpenClassSwitch: () => void;
  onGoHome: () => void;
  onOpenSupabaseModal: () => void;
  onOpenChangePassword: () => void;
  onOpenMyProfile: () => void;
  onOpenQuickEditSchool?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  className,
  schoolName,
  schoolYear,
  teacherName,
  isTeacher,
  studentName,
  syncStatus,
  onOpenMobileSidebar,
  onOpenClassSwitch,
  onGoHome,
  onOpenSupabaseModal,
  onOpenChangePassword,
  onOpenMyProfile,
  onOpenQuickEditSchool,
  onLogout,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const todayText = React.useMemo(() => {
    const d = new Date();
    const days = [
      'Chủ Nhật',
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy',
    ];
    return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }, []);

  return (
    <header className="h-16 lg:h-20 bg-white/95 backdrop-blur-md border-b border-pink-200/80 px-3 sm:px-4 lg:px-7 flex items-center justify-between shrink-0 shadow-xs z-30 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Mở thực đơn"
          className="lg:hidden p-2 rounded-xl text-pink-700 hover:bg-pink-100/70 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Góc trái màn hình: Hình nón tú tài trên nền hồng */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={onGoHome}
            title={`Lớp ${className} - ${schoolName || 'Trường THCS Chu Văn An'}`}
            className="w-10 h-10 lg:w-11 lg:h-11 rounded-2xl bg-linear-to-tr from-pink-500 via-rose-500 to-pink-400 text-white flex items-center justify-center shadow-md shadow-pink-500/25 ring-2 ring-pink-300/50 shrink-0 cursor-pointer active:scale-95 transition-transform"
          >
            <GraduationCap className="w-6 h-6 text-white stroke-[2.2]" />
          </div>

          {/* School Name & Class info display */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-sm lg:text-base font-black text-gray-900 tracking-tight flex items-center gap-1.5 truncate">
                <span className="truncate">{title}</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-300/60 shadow-2xs">
                Lớp {className}
              </span>
            </div>

            {/* Subtitle with School Name & School Year (Linh động chỉnh được) */}
            <div className="flex items-center gap-2 text-[11px] lg:text-xs text-gray-500 mt-0.5 truncate">
              <span className="font-semibold text-gray-700 truncate max-w-[150px] sm:max-w-[220px] md:max-w-[300px]" title={schoolName || 'Trường THCS Chu Văn An'}>
                {schoolName || 'Trường THCS Chu Văn An'}
              </span>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-pink-700 font-medium">
                <Calendar className="w-3 h-3 text-pink-500 shrink-0" />
                <span>Năm học {schoolYear || '2024 - 2025'}</span>
              </span>

              {/* Nút sửa nhanh thông tin trường và năm học bên ngoài (Chỉ giáo viên chủ nhiệm mới thực hiện được) */}
              {isTeacher && onOpenQuickEditSchool && (
                <button
                  type="button"
                  onClick={onOpenQuickEditSchool}
                  title="Chỉnh sửa linh động tên trường, lớp và năm học"
                  className="px-2 py-0.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 hover:text-pink-800 text-[10px] font-bold border border-pink-200/80 transition-all flex items-center gap-1 cursor-pointer ml-1 active:scale-95"
                >
                  <Edit2 className="w-2.5 h-2.5 text-pink-600" />
                  <span className="hidden md:inline">Sửa trường & năm học</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        {/* Cloud Sync Status Pill */}
        <button
          onClick={onOpenSupabaseModal}
          title={
            syncStatus.isTableReady
              ? `Đồng bộ Cloud đã sẵn sàng. Lần cuối: ${syncStatus.lastSyncedAt || 'Vừa xong'}`
              : syncStatus.isConnected
              ? 'Đang kết nối Supabase, cần tạo bảng.'
              : 'Chưa cấu hình Supabase Cloud (lưu trữ cục bộ)'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
            syncStatus.isTableReady
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : syncStatus.isConnected
              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {syncStatus.isTableReady ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          ) : syncStatus.isConnected ? (
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          ) : (
            <Cloud className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="hidden sm:inline">
            {syncStatus.isTableReady
              ? 'Cloud Sync'
              : syncStatus.isConnected
              ? 'Chưa tạo bảng'
              : 'Lưu Cục Bộ'}
          </span>
        </button>

        {/* Quick class switch for teacher */}
        {isTeacher && (
          <button
            onClick={onOpenClassSwitch}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-gray-500" />
            <span>Đổi Lớp ({className})</span>
          </button>
        )}

        {/* User profile / actions dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors bg-white"
          >
            <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {isTeacher ? 'GV' : (studentName ? studentName.charAt(0) : 'HS')}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-gray-800 leading-tight">
                {isTeacher ? `Cô ${teacherName}` : studentName || 'Học sinh'}
              </div>
              <div className="text-[10px] text-gray-400">
                {isTeacher ? 'Giáo viên chủ nhiệm' : 'Học sinh lớp'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fadeIn">
                <div className="px-3.5 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900">
                    {isTeacher ? teacherName : studentName}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {isTeacher ? 'Quyền Quản trị Lớp học' : `Lớp ${className}`}
                  </p>
                </div>

                {!isTeacher && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenMyProfile();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span>Hồ sơ của tôi</span>
                  </button>
                )}

                {isTeacher && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenClassSwitch();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 sm:hidden"
                  >
                    <Layers className="w-4 h-4 text-gray-400" />
                    <span>Chuyển đổi lớp học</span>
                  </button>
                )}

                {isTeacher && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenChangePassword();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <KeyRound className="w-4 h-4 text-gray-400" />
                    <span>Đổi mật khẩu giáo viên</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenSupabaseModal();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                >
                  <Cloud className="w-4 h-4 text-gray-400" />
                  <span>Cài đặt Đám mây (Supabase)</span>
                </button>

                <div className="my-1 border-t border-gray-100" />

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
