import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { supabaseService, SyncStatus } from '../services/supabaseService';

interface SupabaseModalProps {
  isOpen: boolean;
  syncStatus: SyncStatus;
  onCheckConnection: () => void;
  onSyncNow: () => void;
  onPullRemote: () => void;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  syncStatus,
  onCheckConnection,
  onSyncNow,
  onPullRemote,
  onClose,
}) => {
  const [creds, setCreds] = useState(() => supabaseService.getCredentials());
  const [isCopied, setIsCopied] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  if (!isOpen) return null;

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    supabaseService.setCredentials(creds.url, creds.key);
    setSaveMsg('Đã lưu thông tin cấu hình Supabase!');
    setTimeout(() => setSaveMsg(''), 3000);
    onCheckConnection();
  };

  const sqlCode = `-- Chạy đoạn mã này trong mục "SQL Editor" trên trang quản trị Supabase:
CREATE TABLE IF NOT EXISTS public.so_chu_nhiem_data (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tắt Row Level Security (RLS) để cho phép lưu trữ từ ứng dụng
ALTER TABLE public.so_chu_nhiem_data DISABLE ROW LEVEL SECURITY;

-- Bật tính năng lắng nghe Realtime thay đổi
ALTER PUBLICATION supabase_realtime ADD TABLE public.so_chu_nhiem_data;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-6 h-6 text-indigo-200" />
            <div>
              <h3 className="font-bold text-base">Đồng Bộ Đám Mây (Supabase Cloud)</h3>
              <p className="text-[11px] text-indigo-100">
                Lưu trữ dữ liệu thời gian thực và đồng bộ đa thiết bị
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-200 hover:text-white font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Connection status banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              syncStatus.isTableReady
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : syncStatus.isConnected
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            {syncStatus.isTableReady ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : syncStatus.isConnected ? (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <Cloud className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            )}

            <div className="text-xs space-y-1 flex-1">
              <div className="font-bold text-sm">
                {syncStatus.isTableReady
                  ? 'Đã kết nối và sẵn sàng đồng bộ!'
                  : syncStatus.isConnected
                  ? 'Đã kết nối tới Supabase, nhưng chưa có bảng dữ liệu.'
                  : 'Chưa kết nối đám mây (Dữ liệu đang được lưu an toàn tại máy của bạn)'}
              </div>
              <p className="leading-relaxed opacity-90">
                {syncStatus.errorMessage ||
                  (syncStatus.isTableReady
                    ? `Lần đồng bộ gần nhất: ${syncStatus.lastSyncedAt || 'Vừa xong'}. Mọi thay đổi sẽ tự động sao lưu lên đám mây.`
                    : 'Nếu bạn có tài khoản Supabase (miễn phí), hãy điền Project URL & Anon Key để kích hoạt đồng bộ.')}
              </p>
            </div>
          </div>

          {/* Quick Push / Pull buttons */}
          {syncStatus.isTableReady && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={onSyncNow}
                disabled={syncStatus.isSyncing}
                className="py-3 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>
                  {syncStatus.isSyncing ? 'Đang đẩy...' : 'Đẩy dữ liệu hiện tại lên Cloud (Push)'}
                </span>
              </button>

              <button
                onClick={onPullRemote}
                disabled={syncStatus.isSyncing}
                className="py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Tải dữ liệu từ Cloud về máy (Pull)</span>
              </button>
            </div>
          )}

          {/* Supabase URL & Anon Key config form */}
          <form onSubmit={handleSaveCredentials} className="space-y-4">
            <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider">
              Thông Tin Kết Nối Supabase
            </h4>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={creds.url}
                onChange={(e) => setCreds({ ...creds, url: e.target.value })}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Supabase Anon / Public API Key
              </label>
              <input
                type="text"
                value={creds.key}
                onChange={(e) => setCreds({ ...creds, key: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {saveMsg && (
              <p className="text-xs font-bold text-emerald-600">{saveMsg}</p>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onCheckConnection}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Kiểm tra kết nối</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Lưu & Kết Nối
              </button>
            </div>
          </form>

          {/* SQL snippet guide */}
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>Câu lệnh SQL tạo bảng trên Supabase:</span>
              </div>
              <button
                onClick={handleCopySql}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
              {sqlCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
