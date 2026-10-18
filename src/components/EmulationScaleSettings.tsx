import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  HelpCircle,
  Play,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { AppState, ConductGrade, ConductTierConfig, EmulationConfig, EmulationPeriodType } from '../types';
import {
  DEFAULT_EMULATION_CONFIG,
  getEmulationConfigForClass,
  validateConductTiers,
  evaluateStudentEmulation,
} from '../utils/emulationEvaluation';
import { formatViDate } from '../utils/helpers';

interface EmulationScaleSettingsProps {
  state: AppState;
  onUpdateEmulationConfig: (newConfig: EmulationConfig) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const EmulationScaleSettings: React.FC<EmulationScaleSettingsProps> = ({
  state,
  onUpdateEmulationConfig,
  onShowToast,
}) => {
  const currentClass = state.config.className || '8A3';
  const currentYear = state.config.schoolYear || '2024 - 2025';
  const classKey = `${currentClass}_${currentYear}`;

  // Get current emulation config for this class and year
  const activeClassConfig = useMemo(() => {
    return getEmulationConfigForClass(
      state.classEmulationConfigs,
      state.emulationConfig,
      currentClass,
      currentYear
    );
  }, [state.classEmulationConfigs, state.emulationConfig, currentClass, currentYear]);

  // Form states
  const [initialPoints, setInitialPoints] = useState<number>(activeClassConfig.initialPoints ?? 100);
  const [periodType, setPeriodType] = useState<EmulationPeriodType>(activeClassConfig.periodType ?? 'month');
  const [enableMinScore, setEnableMinScore] = useState<boolean>(activeClassConfig.enableMinScore ?? true);
  const [minScore, setMinScore] = useState<number>(activeClassConfig.minScore ?? 0);
  const [enableMaxScore, setEnableMaxScore] = useState<boolean>(activeClassConfig.enableMaxScore ?? false);
  const [maxScore, setMaxScore] = useState<number>(activeClassConfig.maxScore ?? 120);
  const [aggregationMethod, setAggregationMethod] = useState<
    'single_initial' | 'monthly_average' | 'monthly_cumulative'
  >(activeClassConfig.aggregationMethod ?? 'single_initial');

  // Conduct Tiers
  const [tiers, setTiers] = useState<ConductTierConfig[]>(
    activeClassConfig.conductTiers ? JSON.parse(JSON.stringify(activeClassConfig.conductTiers)) : DEFAULT_EMULATION_CONFIG.conductTiers
  );

  // Versioning & Applied date
  const [appliedAt, setAppliedAt] = useState<string>(activeClassConfig.appliedAt || '2024-09-01');

  // Interactive Simulation state
  const [simPlus, setSimPlus] = useState<number>(10);
  const [simMinus, setSimMinus] = useState<number>(2);
  const [simViolations, setSimViolations] = useState<number>(1);

  // Confirmation modal for resetting
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Sync state if external class switch happens
  useEffect(() => {
    setInitialPoints(activeClassConfig.initialPoints ?? 100);
    setPeriodType(activeClassConfig.periodType ?? 'month');
    setEnableMinScore(activeClassConfig.enableMinScore ?? true);
    setMinScore(activeClassConfig.minScore ?? 0);
    setEnableMaxScore(activeClassConfig.enableMaxScore ?? false);
    setMaxScore(activeClassConfig.maxScore ?? 120);
    setAggregationMethod(activeClassConfig.aggregationMethod ?? 'single_initial');
    setTiers(
      activeClassConfig.conductTiers
        ? JSON.parse(JSON.stringify(activeClassConfig.conductTiers))
        : DEFAULT_EMULATION_CONFIG.conductTiers
    );
    setAppliedAt(activeClassConfig.appliedAt || '2024-09-01');
  }, [activeClassConfig]);

  // Validation of tier thresholds
  const validation = useMemo(() => {
    return validateConductTiers(tiers);
  }, [tiers]);

  // Helpers to update individual tier
  const handleUpdateTier = (id: string, updates: Partial<ConductTierConfig>) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  // Build current draft config
  const currentDraftConfig: EmulationConfig = useMemo(() => {
    return {
      initialPoints,
      periodType,
      enableMinScore,
      minScore,
      enableMaxScore,
      maxScore,
      aggregationMethod,
      conductTiers: tiers,
      version: activeClassConfig.version || 1,
      updatedAt: activeClassConfig.updatedAt || new Date().toISOString(),
      appliedAt,
    };
  }, [
    initialPoints,
    periodType,
    enableMinScore,
    minScore,
    enableMaxScore,
    maxScore,
    aggregationMethod,
    tiers,
    activeClassConfig,
    appliedAt,
  ]);

  // Run live simulation
  const simulationResult = useMemo(() => {
    const mockRecords: any[] = [];
    if (simPlus > 0) {
      mockRecords.push({ id: 'sim_p', studentId: 'sim_student', points: simPlus, type: 'plus' });
    }
    for (let i = 0; i < simViolations; i++) {
      const pts = simViolations > 0 ? -(simMinus / simViolations) : -simMinus;
      mockRecords.push({
        id: `sim_m_${i}`,
        studentId: 'sim_student',
        points: pts,
        type: 'minus',
      });
    }

    return evaluateStudentEmulation('sim_student', mockRecords, currentDraftConfig);
  }, [simPlus, simMinus, simViolations, currentDraftConfig]);

  // Save Config
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validation.isValid) {
      onShowToast(validation.errorMessage || 'Thang điểm chưa hợp lệ. Vui lòng kiểm tra lại.', 'error');
      return;
    }

    const newVersion = (activeClassConfig.version || 1) + 1;
    const finalConfig: EmulationConfig = {
      ...currentDraftConfig,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      appliedAt: appliedAt.trim() || '2024-09-01',
    };

    onUpdateEmulationConfig(finalConfig);
    onShowToast(`Đã lưu thành công Thang điểm & Tiêu chí xếp loại cho Lớp ${currentClass} (Phiên bản v${newVersion})!`);
  };

  // Reset to default
  const handleConfirmReset = () => {
    const resetConfig: EmulationConfig = {
      ...DEFAULT_EMULATION_CONFIG,
      version: (activeClassConfig.version || 1) + 1,
      updatedAt: new Date().toISOString(),
      appliedAt: '2024-09-01',
    };

    onUpdateEmulationConfig(resetConfig);
    setIsResetConfirmOpen(false);
    onShowToast(`Đã khôi phục Thang điểm & Tiêu chí về mặc định (Chỉ đặt lại cấu hình, giữ nguyên toàn bộ ghi nhận học sinh).`);
  };

  const totTier = tiers.find((t) => t.id === 'tot') || tiers[0];
  const khaTier = tiers.find((t) => t.id === 'kha') || tiers[1];
  const datTier = tiers.find((t) => t.id === 'dat') || tiers[2];
  const chuaDatTier = tiers.find((t) => t.id === 'chuadat') || tiers[3];

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-pink-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20 shrink-0">
              <Award className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-xs font-black">
                  Lớp {currentClass}
                </span>
                <span className="text-xs text-gray-500 font-semibold">
                  Năm học {currentYear}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                  Phiên bản v{activeClassConfig.version || 1}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-1">
                Thang Điểm Thi Đua & Tiêu Chí Xếp Loại Rèn Luyện
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                Cấu hình điểm khởi đầu, công thức tính điểm và 4 mức xếp loại gợi ý rèn luyện cho lớp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Khôi phục thang điểm về mặc định (không ảnh hưởng dữ liệu học sinh)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              <span>Khôi phục mặc định</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={!validation.isValid}
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-600/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cài Đặt</span>
            </button>
          </div>
        </div>

        {/* Thông tin lưu trữ riêng biệt theo lớp và năm học */}
        <div className="bg-pink-50/50 rounded-2xl p-3.5 border border-pink-200/60 flex items-start gap-3 text-xs text-gray-700">
          <Info className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 flex-1">
            <span className="font-bold text-gray-900">
              Lưu trữ độc lập theo từng lớp học trên Supabase:
            </span>
            <p className="text-gray-600">
              Cấu hình này áp dụng riêng cho <strong>Lớp {currentClass}</strong> (Năm học {currentYear}). Khi chuyển đổi sang lớp khác, hệ thống sẽ tự động chuyển sang thang điểm của lớp đó. Cập nhật mới sẽ không tính lại kết quả các kỳ đã chốt trong quá khứ.
            </p>
          </div>
        </div>
      </div>

      {/* 2. KHỐI 1: THANG ĐIỂM THI ĐUA */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-base font-black text-gray-900">
              1. Thiết Lập Thang Điểm Thi Đua
            </h4>
            <p className="text-xs text-gray-500">
              Xác định điểm nền, kỳ tính điểm và biên độ tối thiểu / tối đa
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Điểm khởi đầu */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Điểm khởi đầu của mỗi học sinh trong một kỳ</span>
              <span className="text-[11px] text-pink-600 font-bold">Hiện có: 100đ</span>
            </label>
            <input
              type="number"
              required
              value={initialPoints}
              onChange={(e) => setInitialPoints(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Mỗi học sinh khi bước vào một kỳ đánh giá mới sẽ bắt đầu với mức điểm này.
            </p>
          </div>

          {/* Kỳ tính điểm mặc định */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              Kỳ tính điểm mặc định
            </label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as EmulationPeriodType)}
              className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
            >
              <option value="month">Theo Tháng (Khuyến nghị thực tế trường học)</option>
              <option value="week">Theo Tuần</option>
              <option value="semester">Theo Học kỳ</option>
              <option value="year">Theo Cả năm học</option>
            </select>
            <p className="text-[11px] text-gray-500 mt-1">
              Thời gian sự việc được xác định theo múi giờ Việt Nam (GMT+7) và tính trọn vẹn ngày bắt đầu, kết thúc.
            </p>
          </div>

          {/* Điểm tối thiểu */}
          <div className="p-4 bg-gray-50/60 rounded-2xl border border-gray-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableMinScore}
                  onChange={(e) => setEnableMinScore(e.target.checked)}
                  className="rounded-md text-pink-600 focus:ring-pink-500 w-4 h-4 cursor-pointer"
                />
                <span>Áp dụng điểm tối thiểu (không bị điểm âm)</span>
              </label>
              <span className="text-[11px] font-bold text-pink-600">
                {enableMinScore ? 'Đang bật' : 'Tắt'}
              </span>
            </div>
            {enableMinScore && (
              <div className="pt-1">
                <input
                  type="number"
                  value={minScore}
                  onChange={(e) => setMinScore(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
                <span className="text-[10px] text-gray-500">
                  Điểm tổng kết kỳ của học sinh sẽ không thấp hơn mức này (Ví dụ: 0 điểm).
                </span>
              </div>
            )}
          </div>

          {/* Điểm tối đa */}
          <div className="p-4 bg-gray-50/60 rounded-2xl border border-gray-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableMaxScore}
                  onChange={(e) => setEnableMaxScore(e.target.checked)}
                  className="rounded-md text-pink-600 focus:ring-pink-500 w-4 h-4 cursor-pointer"
                />
                <span>Áp dụng điểm tối đa (giới hạn điểm trần)</span>
              </label>
              <span className="text-[11px] font-bold text-pink-600">
                {enableMaxScore ? 'Đang bật' : 'Tắt'}
              </span>
            </div>
            {enableMaxScore && (
              <div className="pt-1">
                <input
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(parseInt(e.target.value) || 0)}
                  placeholder="120"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
                <span className="text-[10px] text-gray-500">
                  Điểm tổng kết kỳ của học sinh sẽ không vượt quá mức trần này (Ví dụ: 120 điểm).
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hiển thị rõ công thức tính điểm */}
        <div className="p-4 bg-linear-to-r from-pink-50 via-rose-50 to-pink-50 rounded-2xl border border-pink-200">
          <div className="flex items-center gap-2 text-xs font-black text-pink-900 mb-1">
            <Sparkles className="w-4 h-4 text-pink-600" />
            <span>CÔNG THỨC TÍNH ĐIỂM THI ĐUA CHUẨN CỦA LỚP:</span>
          </div>
          <div className="text-sm font-black text-gray-900 font-mono py-1">
            Tổng điểm thi đua = Điểm khởi đầu ({initialPoints}) + Tổng điểm cộng − Tổng điểm trừ
          </div>
          <p className="text-[11px] text-gray-600 mt-1 font-medium">
            {enableMinScore && `• Điểm sàn tối thiểu: ${minScore}đ  `}
            {enableMaxScore && `• Điểm trần tối đa: ${maxScore}đ  `}
            • Áp dụng nhất quán trên hồ sơ học sinh, giao diện lớp và file Excel thi đua.
          </p>
        </div>

        {/* Cách tính điểm tổng hợp học kỳ / cả năm */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
            Quy tắc tổng hợp điểm Học kỳ / Cả năm học:
          </label>
          <div className="space-y-2 text-xs">
            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 cursor-pointer transition-colors">
              <input
                type="radio"
                name="aggregationMethod"
                value="single_initial"
                checked={aggregationMethod === 'single_initial'}
                onChange={() => setAggregationMethod('single_initial')}
                className="mt-0.5 text-pink-600 focus:ring-pink-500"
              />
              <div>
                <span className="font-bold text-gray-900">
                  Điểm khởi đầu 1 lần cho cả kỳ + Tổng điểm cộng − Tổng điểm trừ toàn kỳ (Khuyến nghị)
                </span>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Không tự cộng dồn điểm khởi đầu của các tháng (tránh làm điểm bị đội lên 400đ - 900đ bất thường).
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 cursor-pointer transition-colors">
              <input
                type="radio"
                name="aggregationMethod"
                value="monthly_average"
                checked={aggregationMethod === 'monthly_average'}
                onChange={() => setAggregationMethod('monthly_average')}
                className="mt-0.5 text-pink-600 focus:ring-pink-500"
              />
              <div>
                <span className="font-bold text-gray-900">
                  Điểm trung bình cộng thi đua của các tháng trong kỳ
                </span>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Lấy trung bình cộng số điểm tổng kết của từng tháng mà học sinh đã rèn luyện.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 cursor-pointer transition-colors">
              <input
                type="radio"
                name="aggregationMethod"
                value="monthly_cumulative"
                checked={aggregationMethod === 'monthly_cumulative'}
                onChange={() => setAggregationMethod('monthly_cumulative')}
                className="mt-0.5 text-pink-600 focus:ring-pink-500"
              />
              <div>
                <span className="font-bold text-gray-900">
                  Điểm khởi đầu mỗi tháng cộng dồn (Tổng điểm tích lũy cả năm)
                </span>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Chỉ chọn khi trường quy định tính điểm lũy kế gộp tất cả các tháng lại với nhau.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 3. KHỐI 2: TIÊU CHÍ XẾP LOẠI RÈN LUYỆN (4 MỨC) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-black text-gray-900">
                2. Tiêu Chí Xếp Loại Rèn Luyện (4 Mức)
              </h4>
              <p className="text-xs text-gray-500">
                Cấu hình ngưỡng điểm, mô tả tham khảo và điều kiện tự động cho từng mức
              </p>
            </div>
          </div>

          {/* Validation Status Indicator */}
          <div>
            {validation.isValid ? (
              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Các khoảng điểm liên tục, không chồng lấn</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>{validation.errorMessage}</span>
              </span>
            )}
          </div>
        </div>

        {/* Continuous Range Bar Preview */}
        {validation.isValid && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <div className="font-black text-sm">Tốt</div>
              <div className="font-mono font-bold mt-0.5">≥ {totTier.minScore} đ</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
              <div className="font-black text-sm">Khá</div>
              <div className="font-mono font-bold mt-0.5">{khaTier.minScore} đến &lt; {totTier.minScore} đ</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
              <div className="font-black text-sm">Đạt</div>
              <div className="font-mono font-bold mt-0.5">{datTier.minScore} đến &lt; {khaTier.minScore} đ</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
              <div className="font-black text-sm">Chưa đạt</div>
              <div className="font-mono font-bold mt-0.5">&lt; {datTier.minScore} đ</div>
            </div>
          </div>
        )}

        {/* 4 Tiers Form Cards */}
        <div className="space-y-4">
          {/* MỨC TỐT */}
          <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-sm font-black text-emerald-900">Mức 1: TỐT</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span>Ngưỡng điểm tối thiểu:</span>
                <div className="flex items-center gap-1">
                  <span>≥</span>
                  <input
                    type="number"
                    value={totTier.minScore}
                    onChange={(e) => handleUpdateTier('tot', { minScore: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-center font-bold text-sm text-emerald-900 focus:ring-2 focus:ring-emerald-400"
                  />
                  <span>điểm</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Mô tả tiêu chuẩn tham khảo (Giáo viên tự nhập hoặc sửa theo quy chế trường):
              </label>
              <textarea
                rows={2}
                value={totTier.description}
                onChange={(e) => handleUpdateTier('tot', { description: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Điều kiện bổ sung tự động */}
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200/80 space-y-2 text-xs">
              <label className="flex items-center gap-2 font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={totTier.additionalRulesEnabled || false}
                  onChange={(e) => handleUpdateTier('tot', { additionalRulesEnabled: e.target.checked })}
                  className="rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Bật điều kiện tự động: Giới hạn số lần vi phạm nề nếp trong kỳ</span>
              </label>

              {totTier.additionalRulesEnabled && (
                <div className="pl-6 space-y-1.5 text-gray-600">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>Nếu số lần vi phạm trong kỳ vượt quá:</span>
                    <input
                      type="number"
                      min={0}
                      value={totTier.maxViolations ?? 1}
                      onChange={(e) => handleUpdateTier('tot', { maxViolations: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold text-xs"
                    />
                    <span>lần, thì hạ xếp loại gợi ý xuống:</span>
                    <select
                      value={totTier.downgradeTo || 'Khá'}
                      onChange={(e) => handleUpdateTier('tot', { downgradeTo: e.target.value as ConductGrade })}
                      className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs text-blue-700"
                    >
                      <option value="Khá">Khá</option>
                      <option value="Đạt">Đạt</option>
                      <option value="Chưa đạt">Chưa đạt</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-amber-700 italic">
                    * Hệ thống sẽ tự động hạ gợi ý từ Tốt xuống {totTier.downgradeTo || 'Khá'} nếu số lần vi phạm lớn hơn {totTier.maxViolations ?? 1} và ghi rõ lý do.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* MỨC KHÁ */}
          <div className="p-4 sm:p-5 rounded-2xl border border-blue-200 bg-blue-50/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-sm font-black text-blue-900">Mức 2: KHÁ</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span>Ngưỡng điểm tối thiểu:</span>
                <div className="flex items-center gap-1">
                  <span>≥</span>
                  <input
                    type="number"
                    value={khaTier.minScore}
                    onChange={(e) => handleUpdateTier('kha', { minScore: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2.5 py-1.5 bg-white border border-blue-300 rounded-xl text-center font-bold text-sm text-blue-900 focus:ring-2 focus:ring-blue-400"
                  />
                  <span>điểm (đến &lt; {totTier.minScore} đ)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Mô tả tiêu chuẩn tham khảo:
              </label>
              <textarea
                rows={2}
                value={khaTier.description}
                onChange={(e) => handleUpdateTier('kha', { description: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Điều kiện bổ sung tự động */}
            <div className="p-3 bg-white/80 rounded-xl border border-blue-200/80 space-y-2 text-xs">
              <label className="flex items-center gap-2 font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={khaTier.additionalRulesEnabled || false}
                  onChange={(e) => handleUpdateTier('kha', { additionalRulesEnabled: e.target.checked })}
                  className="rounded-md text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Bật điều kiện tự động: Giới hạn số lần vi phạm nề nếp trong kỳ</span>
              </label>

              {khaTier.additionalRulesEnabled && (
                <div className="pl-6 space-y-1.5 text-gray-600">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>Nếu số lần vi phạm trong kỳ vượt quá:</span>
                    <input
                      type="number"
                      min={0}
                      value={khaTier.maxViolations ?? 3}
                      onChange={(e) => handleUpdateTier('kha', { maxViolations: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold text-xs"
                    />
                    <span>lần, thì hạ xếp loại gợi ý xuống:</span>
                    <select
                      value={khaTier.downgradeTo || 'Đạt'}
                      onChange={(e) => handleUpdateTier('kha', { downgradeTo: e.target.value as ConductGrade })}
                      className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs text-amber-700"
                    >
                      <option value="Đạt">Đạt</option>
                      <option value="Chưa đạt">Chưa đạt</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MỨC ĐẠT */}
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-sm font-black text-amber-900">Mức 3: ĐẠT</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span>Ngưỡng điểm tối thiểu:</span>
                <div className="flex items-center gap-1">
                  <span>≥</span>
                  <input
                    type="number"
                    value={datTier.minScore}
                    onChange={(e) => handleUpdateTier('dat', { minScore: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-center font-bold text-sm text-amber-900 focus:ring-2 focus:ring-amber-400"
                  />
                  <span>điểm (đến &lt; {khaTier.minScore} đ)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Mô tả tiêu chuẩn tham khảo:
              </label>
              <textarea
                rows={2}
                value={datTier.description}
                onChange={(e) => handleUpdateTier('dat', { description: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* MỨC CHƯA ĐẠT */}
          <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="text-sm font-black text-rose-900">Mức 4: CHƯA ĐẠT</span>
              </div>
              <div className="text-xs font-bold text-rose-800">
                <span>Tất cả các trường hợp có điểm thi đua &lt; {datTier.minScore} điểm</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Mô tả tiêu chuẩn tham khảo:
              </label>
              <textarea
                rows={2}
                value={chuaDatTier.description}
                onChange={(e) => handleUpdateTier('chuadat', { description: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. KHỐI 3: VÍ DỤ XEM TRƯỚC CÁCH TÍNH & XẾP LOẠI (LIVE SIMULATION) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
            <Play className="w-4 h-4 fill-indigo-700" />
          </div>
          <div>
            <h4 className="text-base font-black text-gray-900">
              3. Ví Dụ Xem Trước Cách Tính & Xếp Loại Thời Gian Thực
            </h4>
            <p className="text-xs text-gray-500">
              Thử nghiệm điểm số để đối chiếu kết quả tính toán trước khi áp dụng chính thức
            </p>
          </div>
        </div>

        {/* Inputs simulation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Điểm cộng tích cực thử:
            </label>
            <input
              type="number"
              min={0}
              value={simPlus}
              onChange={(e) => setSimPlus(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Điểm trừ vi phạm thử:
            </label>
            <input
              type="number"
              min={0}
              value={simMinus}
              onChange={(e) => setSimMinus(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-rose-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Số lần vi phạm nề nếp thử:
            </label>
            <input
              type="number"
              min={0}
              value={simViolations}
              onChange={(e) => setSimViolations(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
            />
          </div>
        </div>

        {/* Results simulation box */}
        <div className="p-4 bg-linear-to-r from-gray-50 via-pink-50/30 to-gray-50 rounded-2xl border border-gray-200/90 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                CÔNG THỨC CHI TIẾT
              </span>
              <div className="text-sm font-mono font-bold text-gray-800 mt-0.5">
                {simulationResult.initialPoints} (Khởi đầu) + {simulationResult.plusPoints} (Cộng) − {simulationResult.minusPoints} (Trừ) = {simulationResult.rawTotalPoints} đ
              </div>
              {(simulationResult.minScoreApplied || simulationResult.maxScoreApplied) && (
                <div className="text-[11px] text-amber-700 font-bold mt-0.5">
                  → Sau áp dụng giới hạn Min/Max: <strong>{simulationResult.finalTotalPoints} đ</strong>
                </div>
              )}
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                XẾP LOẠI GỢI Ý THEO THI ĐUA
              </span>
              <div className="inline-flex items-center gap-2 mt-0.5">
                <span
                  className={`text-lg sm:text-xl font-black px-3 py-1 rounded-xl ${
                    simulationResult.suggestedRating === 'Tốt'
                      ? 'bg-emerald-100 text-emerald-800'
                      : simulationResult.suggestedRating === 'Khá'
                      ? 'bg-blue-100 text-blue-800'
                      : simulationResult.suggestedRating === 'Đạt'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {simulationResult.suggestedRating}
                </span>
              </div>
            </div>
          </div>

          {/* Downgrade explanation if applicable */}
          {simulationResult.isDowngraded && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{simulationResult.downgradeReason}</span>
            </div>
          )}

          {/* Legal / Procedure disclaimer as requested */}
          <div className="pt-2 border-t border-gray-200/80 text-[11px] text-gray-500 italic">
            * Lưu ý: Kết quả dựa trên điểm thi đua được ghi là <strong>“Xếp loại gợi ý theo thi đua”</strong>. Kết quả đánh giá rèn luyện chính thức của học sinh do giáo viên chủ nhiệm xác nhận, có thể điều chỉnh và ghi rõ lý do trong hồ sơ học sinh.
          </div>
        </div>
      </div>

      {/* 5. KHỐI LƯU & QUẢN LÝ PHIÊN BẢN */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-gray-600 space-y-1">
          <div>
            • Phiên bản áp dụng hiện tại:{' '}
            <strong className="text-gray-900">v{activeClassConfig.version || 1}</strong>
          </div>
          <div>
            • Thời điểm cập nhật cuối:{' '}
            <strong className="text-gray-900">
              {activeClassConfig.updatedAt
                ? new Date(activeClassConfig.updatedAt).toLocaleString('vi-VN')
                : 'Chưa cập nhật'}
            </strong>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <span>• Thời điểm bắt đầu áp dụng:</span>
            <input
              type="date"
              value={appliedAt}
              onChange={(e) => setAppliedAt(e.target.value)}
              className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={!validation.isValid}
          className="px-6 py-3 rounded-2xl bg-linear-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-sm shadow-md shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Save className="w-5 h-5" />
          <span>Lưu Cài Đặt Thang Điểm & Xếp Loại</span>
        </button>
      </div>

      {/* Confirmation Modal for Resetting */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-lg font-black text-gray-900">
                Xác Nhận Khôi Phục Thang Điểm Mặc Định?
              </h4>
              <p className="text-xs text-gray-600">
                Thao tác này sẽ đặt lại Thang điểm thi đua và 4 mức Tiêu chí xếp loại rèn luyện của <strong>Lớp {currentClass}</strong> về cấu hình ban đầu.
              </p>
              <p className="text-xs text-emerald-700 font-bold pt-1">
                Hoàn toàn KHÔNG xóa hay thay đổi bất kỳ ghi nhận vi phạm, khen thưởng nào của học sinh.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Đồng ý khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
