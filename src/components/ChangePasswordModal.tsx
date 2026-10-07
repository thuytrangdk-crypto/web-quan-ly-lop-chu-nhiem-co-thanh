import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, X, Check } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  currentPassword?: string;
  onSave: (newPass: string) => void;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  title,
  description,
  currentPassword,
  onSave,
  onClose,
}) => {
  const [oldPassInput, setOldPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPassword && oldPassInput.trim() !== currentPassword.trim()) {
      setError('Mật khẩu hiện tại không đúng!');
      return;
    }
    if (!newPassInput.trim()) {
      setError('Vui lòng nhập mật khẩu mới!');
      return;
    }
    if (newPassInput !== confirmPassInput) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    onSave(newPassInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-200" />
            <h3 className="font-bold text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-200 hover:text-white font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {description && (
            <p className="text-xs text-gray-500 leading-relaxed">
              {description}
            </p>
          )}

          {currentPassword && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Mật Khẩu Hiện Tại
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={oldPassInput}
                  onChange={(e) => {
                    setOldPassInput(e.target.value);
                    setError('');
                  }}
                  placeholder="Nhập mật khẩu cũ..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Mật Khẩu Mới
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={newPassInput}
                onChange={(e) => {
                  setNewPassInput(e.target.value);
                  setError('');
                }}
                placeholder="Nhập mật khẩu mới..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Xác Nhận Mật Khẩu Mới
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={confirmPassInput}
              onChange={(e) => {
                setConfirmPassInput(e.target.value);
                setError('');
              }}
              placeholder="Nhập lại mật khẩu mới..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-semibold">{error}</p>
          )}

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Lưu Mật Khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
