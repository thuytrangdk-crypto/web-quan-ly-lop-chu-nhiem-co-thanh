import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Award } from 'lucide-react';
import { AppState, ConductTierConfig, EmulationConfig } from '../types';
import {
  DEFAULT_EMULATION_CONFIG,
  getEmulationConfigForClass,
  validateConductTiers,
} from '../utils/emulationEvaluation';

interface EmulationScaleSettingsProps {
  state: AppState;
  onUpdateEmulationConfig: (newConfig: EmulationConfig) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

/**
 * Bố cục khung duy nhất theo mẫu màu xanh:
 * - Tiêu đề: "Thang điểm thi đua & Tiêu chí xếp loại"
 * - Phía trên: ô "Điểm thi đua chuẩn ban đầu"
 * - Bên dưới: 3 thẻ nằm ngang: TỐT, KHÁ, ĐẠT
 * - Dòng chú thích: "Điểm dưới ngưỡng Đạt được xếp loại gợi ý Chưa đạt"
 * - Nút "Lưu thang điểm & tiêu chí" luôn dễ nhìn thấy
 * - Điều kiện: Tốt > Khá > Đạt. Chấp nhận mọi số hữu hạn (kể cả 0, số âm, số thập phân).
 */
export const EmulationScaleSettings: React.FC<EmulationScaleSettingsProps> = ({
  state,
  onUpdateEmulationConfig,
  onShowToast,
}) => {
  const currentClass = state.config.className || '6A8';
  const currentYear = state.config.schoolYear || '2024 - 2025';

  // Lấy cấu hình thi đua hiện có của đúng lớp và năm học đang chọn
  const activeClassConfig = getEmulationConfigForClass(
    state.classEmulationConfigs,
    state.emulationConfig,
    currentClass,
    currentYear
  );

  // Trạng thái chuỗi cho các ô nhập để cho phép xóa tạm, gõ số mới, không bị nhảy số hay ép mốc cũ
  const [initialPointsInput, setInitialPointsInput] = useState<string>('100');
  const [totInput, setTotInput] = useState<string>('105');
  const [khaInput, setKhaInput] = useState<string>('90');
  const [datInput, setDatInput] = useState<string>('70');

  // Lỗi hiển thị tại từng ô và lỗi tổng quát
  const [fieldErrors, setFieldErrors] = useState<{
    initialPoints?: string;
    tot?: string;
    kha?: string;
    dat?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Tải đúng cấu hình đã lưu của lớp khi mở hoặc khi lớp thay đổi
  useEffect(() => {
    const totTier = activeClassConfig.conductTiers?.find((t) => t.id === 'tot');
    const khaTier = activeClassConfig.conductTiers?.find((t) => t.id === 'kha');
    const datTier = activeClassConfig.conductTiers?.find((t) => t.id === 'dat');

    const initPts = activeClassConfig.initialPoints !== undefined ? activeClassConfig.initialPoints : 100;
    const tVal = totTier?.minScore !== undefined ? totTier.minScore : 105;
    const kVal = khaTier?.minScore !== undefined ? khaTier.minScore : 90;
    const dVal = datTier?.minScore !== undefined ? datTier.minScore : 70;

    setInitialPointsInput(String(initPts));
    setTotInput(String(tVal));
    setKhaInput(String(kVal));
    setDatInput(String(dVal));
    setFieldErrors({});
    setGeneralError(null);
  }, [activeClassConfig, currentClass, currentYear]);

  // Phân tích số hữu hạn linh hoạt (hỗ trợ cả dấu chấm . và phẩy ,)
  const parseVal = (val: string): number | null => {
    const trimmed = val.trim().replace(',', '.');
    if (trimmed === '') return null;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  };

  // Xử lý Lưu Thang điểm & Tiêu chí
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const initPts = parseVal(initialPointsInput);
    const totScore = parseVal(totInput);
    const khaScore = parseVal(khaInput);
    const datScore = parseVal(datInput);

    const errors: {
      initialPoints?: string;
      tot?: string;
      kha?: string;
      dat?: string;
    } = {};

    if (initPts === null) {
      errors.initialPoints = 'Vui lòng nhập điểm ban đầu hợp lệ (số nguyên hoặc số thập phân).';
    }
    if (totScore === null) {
      errors.tot = 'Vui lòng nhập điểm ngưỡng Tốt.';
    }
    if (khaScore === null) {
      errors.kha = 'Vui lòng nhập điểm ngưỡng Khá.';
    }
    if (datScore === null) {
      errors.dat = 'Vui lòng nhập điểm ngưỡng Đạt.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setGeneralError('Vui lòng kiểm tra lại các ô nhập điểm chưa đúng định dạng số.');
      onShowToast('Vui lòng kiểm tra lại các ô nhập điểm', 'error');
      return;
    }

    // Điều kiện giữa các ngưỡng chỉ là: Tốt > Khá > Đạt
    const draftTiers: ConductTierConfig[] = [
      { id: 'tot', label: 'Tốt', minScore: totScore!, description: 'Đạt ngưỡng xếp loại Tốt' },
      { id: 'kha', label: 'Khá', minScore: khaScore!, description: 'Đạt ngưỡng xếp loại Khá' },
      { id: 'dat', label: 'Đạt', minScore: datScore!, description: 'Đạt ngưỡng xếp loại Đạt' },
      { id: 'chuadat', label: 'Chưa đạt', minScore: datScore!, description: 'Điểm dưới ngưỡng Đạt' },
    ];

    const validation = validateConductTiers(draftTiers, initPts!);
    if (!validation.isValid) {
      if (validation.fieldErrors) {
        setFieldErrors(validation.fieldErrors);
      }
      setGeneralError(validation.errorMessage || 'Điều kiện giữa các ngưỡng phải là: Tốt > Khá > Đạt.');
      onShowToast(validation.errorMessage || 'Thang điểm chưa hợp lệ', 'error');
      return;
    }

    // Lưu cấu hình hợp lệ
    const newVersion = (activeClassConfig.version || 1) + 1;
    const updatedConfig: EmulationConfig = {
      ...activeClassConfig,
      initialPoints: initPts!,
      periodType: activeClassConfig.periodType || 'month',
      enableMinScore: false,
      enableMaxScore: false,
      aggregationMethod: 'single_initial',
      conductTiers: draftTiers,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      appliedAt: activeClassConfig.appliedAt || '2024-09-01',
    };

    onUpdateEmulationConfig(updatedConfig);
    setFieldErrors({});
    setGeneralError(null);
    onShowToast(`Đã lưu thang điểm & tiêu chí lớp ${currentClass} thành công!`);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-blue-200/90 shadow-xs max-w-4xl mx-auto space-y-6">
      {/* 1. Header Khung Duy Nhất */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
              Thang điểm thi đua & Tiêu chí xếp loại
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-blue-700 font-semibold">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                Lớp {currentClass}
              </span>
              <span>•</span>
              <span className="text-gray-500">Năm học: {currentYear}</span>
              {activeClassConfig.version && (
                <>
                  <span>•</span>
                  <span className="text-gray-400">Phiên bản v{activeClassConfig.version}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 2. Phía trên: Ô “Điểm thi đua chuẩn ban đầu” */}
        <div className="bg-blue-50/70 rounded-2xl p-4 sm:p-5 border border-blue-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label
                htmlFor="initial-points-input"
                className="block text-sm font-black text-blue-950 uppercase tracking-wide cursor-pointer"
              >
                Điểm thi đua chuẩn ban đầu
              </label>
              <p className="text-xs text-blue-800/80 mt-0.5 font-medium">
                Mức điểm khởi đầu của mỗi học sinh trong kỳ (trước khi cộng điểm thưởng hoặc trừ điểm vi phạm)
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <input
                id="initial-points-input"
                type="text"
                inputMode="decimal"
                value={initialPointsInput}
                onChange={(e) => {
                  setInitialPointsInput(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, initialPoints: undefined }));
                  setGeneralError(null);
                }}
                placeholder="100"
                className={`w-32 px-3.5 py-2.5 bg-white border rounded-xl text-base font-black text-gray-900 text-center focus:outline-hidden focus:ring-2 transition-all ${
                  fieldErrors.initialPoints
                    ? 'border-rose-400 focus:ring-rose-300'
                    : 'border-blue-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
              <span className="text-sm font-bold text-blue-900">điểm</span>
            </div>
          </div>
          {fieldErrors.initialPoints && (
            <p className="text-xs text-rose-600 font-bold mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors.initialPoints}</span>
            </p>
          )}
        </div>

        {/* 3. Phía dưới: 3 thẻ nằm ngang (TỐT, KHÁ, ĐẠT) - Trên điện thoại tự xuống dòng */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {/* THẺ TỐT */}
          <div className="bg-sky-50/80 border border-sky-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:border-sky-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-sky-200/60">
                <span className="text-base font-black text-sky-900 tracking-wide">TỐT</span>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-200/70 px-2 py-0.5 rounded-md">
                  ≥ Ngưỡng T
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-sky-950 shrink-0">Từ</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={totInput}
                  onChange={(e) => {
                    setTotInput(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, tot: undefined }));
                    setGeneralError(null);
                  }}
                  placeholder="105"
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-base font-black text-gray-900 text-center focus:outline-hidden focus:ring-2 transition-all ${
                    fieldErrors.tot
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-sky-300 focus:border-sky-500 focus:ring-sky-200'
                  }`}
                />
                <span className="text-sm font-bold text-sky-950 shrink-0">điểm</span>
              </div>
            </div>
            {fieldErrors.tot ? (
              <p className="text-xs text-rose-600 font-bold mt-2.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.tot}</span>
              </p>
            ) : (
              <p className="text-[11px] text-sky-700/80 mt-2.5 font-medium">
                Điểm thi đua từ {totInput || '...'} trở lên
              </p>
            )}
          </div>

          {/* THẺ KHÁ */}
          <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-200/60">
                <span className="text-base font-black text-blue-900 tracking-wide">KHÁ</span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-200/70 px-2 py-0.5 rounded-md">
                  K ≤ Điểm &lt; T
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-blue-950 shrink-0">Từ</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={khaInput}
                  onChange={(e) => {
                    setKhaInput(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, kha: undefined }));
                    setGeneralError(null);
                  }}
                  placeholder="90"
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-base font-black text-gray-900 text-center focus:outline-hidden focus:ring-2 transition-all ${
                    fieldErrors.kha
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-blue-300 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                />
                <span className="text-sm font-bold text-blue-950 shrink-0">điểm</span>
              </div>
            </div>
            {fieldErrors.kha ? (
              <p className="text-xs text-rose-600 font-bold mt-2.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.kha}</span>
              </p>
            ) : (
              <p className="text-[11px] text-blue-700/80 mt-2.5 font-medium">
                Từ {khaInput || '...'} đến dưới {totInput || '...'} điểm
              </p>
            )}
          </div>

          {/* THẺ ĐẠT */}
          <div className="bg-teal-50/80 border border-teal-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:border-teal-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-teal-200/60">
                <span className="text-base font-black text-teal-900 tracking-wide">ĐẠT</span>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-200/70 px-2 py-0.5 rounded-md">
                  D ≤ Điểm &lt; K
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-teal-950 shrink-0">Từ</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={datInput}
                  onChange={(e) => {
                    setDatInput(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, dat: undefined }));
                    setGeneralError(null);
                  }}
                  placeholder="70"
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-base font-black text-gray-900 text-center focus:outline-hidden focus:ring-2 transition-all ${
                    fieldErrors.dat
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-teal-300 focus:border-teal-500 focus:ring-teal-200'
                  }`}
                />
                <span className="text-sm font-bold text-teal-950 shrink-0">điểm</span>
              </div>
            </div>
            {fieldErrors.dat ? (
              <p className="text-xs text-rose-600 font-bold mt-2.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.dat}</span>
              </p>
            ) : (
              <p className="text-[11px] text-teal-700/80 mt-2.5 font-medium">
                Từ {datInput || '...'} đến dưới {khaInput || '...'} điểm
              </p>
            )}
          </div>
        </div>

        {/* 4. Dòng chú thích */}
        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/70 text-xs text-gray-700 space-y-1.5">
          <div className="font-black text-blue-900 flex items-center gap-2 text-xs sm:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <span>Điểm dưới ngưỡng Đạt được xếp loại gợi ý Chưa đạt.</span>
          </div>
          <div className="text-[11px] text-gray-600 pl-4 space-y-0.5 font-medium">
            <p>
              • <strong>Cách tính:</strong> Điểm thi đua = Điểm ban đầu + Tổng điểm thưởng − Tổng điểm vi phạm.
            </p>
            <p>
              • <strong>Nguyên tắc xếp loại:</strong> Điểm ≥ Tốt: Tốt; Khá ≤ Điểm &lt; Tốt: Khá; Đạt ≤ Điểm &lt; Khá: Đạt; Điểm &lt; Đạt: Chưa đạt.
            </p>
            <p className="text-gray-500 italic">
              • Đây là xếp loại gợi ý theo điểm thi đua; giáo viên luôn giữ quyền xác nhận kết quả rèn luyện chính thức cho từng học sinh.
            </p>
          </div>
        </div>

        {/* Thông báo lỗi tổng quát nếu có */}
        {generalError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* 5. Nút “Lưu thang điểm & tiêu chí” luôn dễ nhìn thấy */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 font-medium">
            Điều kiện hợp lệ: <strong className="text-gray-800">Tốt &gt; Khá &gt; Đạt</strong> (chấp nhận số hữu hạn, 0, số âm, số thập phân).
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Lưu thang điểm &amp; tiêu chí</span>
          </button>
        </div>
      </form>
    </div>
  );
};
