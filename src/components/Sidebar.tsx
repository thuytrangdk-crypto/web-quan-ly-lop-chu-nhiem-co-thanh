import React, { useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Megaphone,
  Settings,
  LogOut,
  Camera,
  Layers,
  KeyRound,
  User,
  X,
  GraduationCap,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { SyncStatus } from '../services/supabaseService';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  className: string;
  schoolName?: string;
  classAvatar?: string;
  isTeacher: boolean;
  studentName?: string;
  onUpdateClassAvatar: (base64: string) => void;
  onOpenClassSwitch: () => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSupabaseModal: () => void;
  onOpenChangePassword: () => void;
  onOpenMyProfile: () => void;
  syncStatus: SyncStatus;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  className,
  schoolName,
  classAvatar,
  isTeacher,
  studentName,
  onUpdateClassAvatar,
  onOpenClassSwitch,
  onLogout,
  isMobileOpen,
  onCloseMobile,
  onOpenSupabaseModal,
  onOpenChangePassword,
  onOpenMyProfile,
  syncStatus,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateClassAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan Lớp', icon: LayoutDashboard },
    { id: 'students', label: 'Học sinh & Hồ sơ', icon: Users },
    { id: 'attendance', label: 'Điểm danh Chuyên cần', icon: CalendarCheck },
    { id: 'board', label: 'Bảng tin & Sơ đồ', icon: Megaphone },
    ...(isTeacher
      ? [{ id: 'settings', label: 'Cài đặt & Sao lưu', icon: Settings }]
      : []),
  ];

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800">
      {/* Brand header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Góc trái: Hình nón tú tài trên nền hồng */}
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-pink-500 via-rose-500 to-pink-400 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 ring-2 ring-pink-300/40 shrink-0">
            <GraduationCap className="w-7 h-7 text-white stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-white">
                Lớp {className}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Sổ Chủ Nhiệm
              </span>
            </div>
            <p className="text-xs text-pink-200/70 font-medium truncate max-w-[145px]" title={schoolName || 'Trường THCS Chu Văn An'}>
              {schoolName || 'Trường THCS Chu Văn An'}
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Pill Banner */}
      <div className="px-4 pt-3 pb-1">
        <div className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isTeacher ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span className="font-medium text-slate-300">
              {isTeacher ? 'Giáo viên Chủ nhiệm' : `Học sinh: ${studentName || ''}`}
            </span>
          </div>
          {!isTeacher && (
            <button
              onClick={onOpenMyProfile}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Hồ sơ
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                isActive
                  ? 'bg-linear-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform ${
                  isActive ? 'scale-110 text-white' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick shortcuts for Teacher */}
      {isTeacher && (
        <div className="px-3 py-2 border-t border-slate-800/80 space-y-1">
          <button
            onClick={() => {
              onOpenClassSwitch();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Chuyển Đổi Lớp Học</span>
          </button>
          <button
            onClick={() => {
              onOpenChangePassword();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <KeyRound className="w-4 h-4 text-slate-400" />
            <span>Đổi Mật Khẩu GV</span>
          </button>
        </div>
      )}

      {/* Footer / Cloud & Logout */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <button
          onClick={() => {
            onOpenSupabaseModal();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-indigo-400" />
            <span>Supabase Cloud</span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              syncStatus.isTableReady
                ? 'bg-emerald-400'
                : syncStatus.isConnected
                ? 'bg-amber-400'
                : 'bg-slate-500'
            }`}
          />
        </button>

        <button
          onClick={() => {
            onLogout();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất khỏi hệ thống</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 h-full flex-col shrink-0 select-none">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-fadeIn">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
