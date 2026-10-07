import React, { useState, useEffect } from 'react';
import { School, Calendar, User, BookOpen, X, Check, Sparkles } from 'lucide-react';

interface QuickEditSchoolModalProps {
  isOpen: boolean;
  schoolName: string;
  className: string;
  schoolYear: string;
  teacherName: string;
  onSave: (data: {
    schoolName: string;
    className: string;
    schoolYear: string;
    teacherName: string;
  }) => void;
  onClose: () => void;
}

export const QuickEditSchoolModal: React.FC<QuickEditSchoolModalProps> = ({
  isOpen,
  schoolName,
  className,
  schoolYear,
  teacherName,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    schoolName,
    className,
    schoolYear,
    teacherName,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        schoolName,
        className,
        schoolYear,
        teacherName,
      });
    }
  }, [isOpen, schoolName, className, schoolYear, teacherName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className.trim()) return;
    onSave({
      schoolName: formData.schoolName.trim() || 'Trường THCS Chu Văn An',
      className: formData.className.trim(),
      schoolYear: formData.schoolYear.trim() || '2024 - 2025',
      teacherName: formData.teacherName.trim() || 'Nguyễn Thị Thùy Trang',
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Pink Gradient */}
        <div className="bg-linear-to-r from-pink-500 via-rose-500 to-pink-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Chỉnh Sửa Thông Tin Bên Ngoài</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              <p className="text-xs text-pink-100 mt-0.5 font-medium">
                Dành cho Giáo viên Chủ nhiệm tùy chỉnh linh động tên trường, lớp và năm học
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-pink-50/20">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-pink-500" />
              <span>Tên Trường Học *</span>
            </label>
            <input
              type="text"
              required
              value={formData.schoolName}
              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              placeholder="VD: Trường THCS Chu Văn An"
              className="w-full px-4 py-3 bg-white border border-pink-200 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-pink-500" />
                <span>Tên Lớp Chủ Nhiệm *</span>
              </label>
              <input
                type="text"
                required
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                placeholder="VD: 8A3"
                className="w-full px-4 py-3 bg-white border border-pink-200 rounded-2xl text-sm font-bold text-pink-700 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-pink-500" />
                <span>Năm Học *</span>
              </label>
              <input
                type="text"
                required
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                placeholder="VD: 2024 - 2025"
                className="w-full px-4 py-3 bg-white border border-pink-200 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-pink-500" />
              <span>Họ Tên Giáo Viên Chủ Nhiệm *</span>
            </label>
            <input
              type="text"
              required
              value={formData.teacherName}
              onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
              placeholder="VD: Cô Nguyễn Thị Thùy Trang"
              className="w-full px-4 py-3 bg-white border border-pink-200 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-xs"
            />
          </div>

          <div className="pt-3 border-t border-pink-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-linear-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 active:scale-95 text-white shadow-md shadow-pink-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Thông Tin Ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
