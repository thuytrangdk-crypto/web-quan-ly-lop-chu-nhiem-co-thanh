import React, { useState } from 'react';
import { AppState } from '../types';
import {
  Settings,
  Save,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  School,
  Lock,
  Layers,
  FileText,
} from 'lucide-react';
import { SyncStatus } from '../services/supabaseService';

interface SettingsViewProps {
  state: AppState;
  onUpdateConfig: (newConfig: Partial<AppState['config']>) => void;
  onResetData: () => void;
  onClearAllData: () => void;
  onImportBackup: (backupState: AppState) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  syncStatus: SyncStatus;
  onOpenSupabaseModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  onUpdateConfig,
  onResetData,
  onClearAllData,
  onImportBackup,
  onShowToast,
  syncStatus,
  onOpenSupabaseModal,
}) => {
  const [formConfig, setFormConfig] = useState(state.config);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formConfig);
    onShowToast('Đã lưu cấu hình lớp học thành công!');
  };

  const handleExportBackup = () => {
    const jsonString = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Sao_luu_so_chu_nhiem_${state.config.className}_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Đã tải xuống file sao lưu hệ thống (JSON)');
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.config && Array.isArray(parsed.students)) {
            onImportBackup(parsed);
            onShowToast('Khôi phục dữ liệu từ bản sao lưu thành công!');
          } else {
            onShowToast('File sao lưu không đúng định dạng', 'error');
          }
        } catch {
          onShowToast('Không thể đọc file sao lưu JSON', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>Cài Đặt Hệ Thống & Sao Lưu</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tùy chỉnh thông tin lớp học, năm học, kết nối đám mây và an toàn dữ liệu
          </p>
        </div>
      </div>

      {/* Class Config Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">
                Thông Tin Nhà Trường, Lớp Học & Giáo Viên Chủ Nhiệm
              </h3>
              <p className="text-xs text-gray-500">
                Chỉ có Giáo viên chủ nhiệm mới có quyền thay đổi thông tin này. Thay đổi sẽ cập nhật đồng bộ toàn hệ thống.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-200">
            Quyền Chủ Nhiệm
          </span>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Tên Trường Học *
              </label>
              <input
                type="text"
                value={formConfig.schoolName || ''}
                onChange={(e) => setFormConfig({ ...formConfig, schoolName: e.target.value })}
                placeholder="VD: Trường THCS Chu Văn An"
                className="w-full px-3.5 py-2.5 bg-pink-50/30 border border-pink-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 font-semibold text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Tên Lớp Chủ Nhiệm *
              </label>
              <input
                type="text"
                value={formConfig.className}
                onChange={(e) => setFormConfig({ ...formConfig, className: e.target.value })}
                placeholder="VD: 8A3"
                className="w-full px-3.5 py-2.5 bg-pink-50/30 border border-pink-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 font-bold text-pink-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Năm Học *
              </label>
              <input
                type="text"
                value={formConfig.schoolYear}
                onChange={(e) => setFormConfig({ ...formConfig, schoolYear: e.target.value })}
                placeholder="VD: 2024 - 2025"
                className="w-full px-3.5 py-2.5 bg-pink-50/30 border border-pink-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 font-semibold text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Họ và Tên Giáo Viên Chủ Nhiệm *
              </label>
              <input
                type="text"
                value={formConfig.teacherName}
                onChange={(e) => setFormConfig({ ...formConfig, teacherName: e.target.value })}
                placeholder="VD: Cô Nguyễn Thị Thùy Trang"
                className="w-full px-3.5 py-2.5 bg-pink-50/30 border border-pink-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 font-semibold text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Tên Ứng Dụng
              </label>
              <input
                type="text"
                value={formConfig.appName}
                onChange={(e) => setFormConfig({ ...formConfig, appName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-pink-50/30 border border-pink-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Mật Khẩu Quản Lý Giáo Viên
              </label>
              <input
                type="text"
                value={formConfig.teacherPassword}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, teacherPassword: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-pink-50/30 border border-pink-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Danh Sách Các Lớp (Cách nhau dấu phẩy)
              </label>
              <input
                type="text"
                value={(formConfig.availableClasses || []).join(', ')}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    availableClasses: e.target.value
                      .split(',')
                      .map((c) => c.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="8A3, 9A5, 7A1, 6A2"
                className="w-full px-3.5 py-2.5 bg-pink-50/30 border border-pink-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-linear-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-pink-600/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cài Đặt Lớp Học</span>
            </button>
          </div>
        </form>
      </div>

      {/* Cloud Sync Supabase Box */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-600" />
            <span>Đồng Bộ Đám Mây (Supabase Cloud)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-lg">
            Kết nối với Supabase để lưu trữ dữ liệu an toàn trên đám mây, tự động đồng bộ thời gian thực giữa điện thoại, máy tính giáo viên và học sinh.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus.isTableReady
                  ? 'bg-emerald-500'
                  : syncStatus.isConnected
                  ? 'bg-amber-500'
                  : 'bg-gray-400'
              }`}
            />
            <span className="text-xs font-semibold text-gray-700">
              {syncStatus.isTableReady
                ? 'Đang hoạt động & Đã đồng bộ'
                : syncStatus.isConnected
                ? 'Đã kết nối, chờ tạo bảng SQL'
                : 'Đang hoạt động ở chế độ Lưu cục bộ (LocalStorage)'}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenSupabaseModal}
          className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors shrink-0 cursor-pointer"
        >
          Cấu hình Supabase Cloud
        </button>
      </div>

      {/* Backup and Data Safety */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
          <Save className="w-4 h-4 text-emerald-600" />
          <span>Sao Lưu & An Toàn Dữ Liệu</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export JSON */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-gray-800">
                Xuất File Sao Lưu Dự Phòng (.JSON)
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Tải về toàn bộ hồ sơ học sinh, điểm số, điểm danh, nề nếp và bảng tin về máy tính cá nhân.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="mt-3 w-full py-2 px-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              <span>Tải file sao lưu JSON</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-gray-800">
                Khôi Phục Từ File Sao Lưu (.JSON)
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Chọn file JSON đã lưu trước đây để phục hồi lại toàn bộ hệ thống lớp.
              </p>
            </div>
            <label className="mt-3 w-full py-2 px-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5 text-gray-600" />
              <span>Chọn file JSON để khôi phục</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackupFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Danger zone */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Khu Vực Nguy Hiểm</span>
          </h4>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Khôi phục lại dữ liệu mẫu 8 học sinh ban đầu? Tất cả dữ liệu hiện tại sẽ được thay thế bằng mẫu ban đầu.'
                  )
                ) {
                  onResetData();
                  onShowToast('Đã khôi phục dữ liệu mẫu ban đầu');
                }
              }}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Khôi phục dữ liệu mẫu ban đầu</span>
            </button>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    'CẢNH BÁO: Hành động này sẽ XÓA SẠCH toàn bộ học sinh, điểm danh, nề nếp và thông báo! Bạn có chắc chắn không?'
                  )
                ) {
                  onClearAllData();
                  onShowToast('Đã xóa sạch toàn bộ dữ liệu');
                }
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa sạch toàn bộ dữ liệu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
