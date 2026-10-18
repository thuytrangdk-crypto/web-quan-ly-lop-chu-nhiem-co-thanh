import {
  ConductGrade,
  ConductTierConfig,
  DisciplineRecord,
  EmulationConfig,
  Student,
} from '../types';

export const DEFAULT_EMULATION_CONFIG: EmulationConfig = {
  // Điểm khởi đầu của mỗi học sinh trong một kỳ (mặc định 100 theo đúng hệ thống hiện có)
  initialPoints: 100,
  periodType: 'month',

  // Điểm tối thiểu, điểm tối đa; có thể bật/tắt giới hạn
  enableMinScore: true,
  minScore: 0,
  enableMaxScore: false,
  maxScore: 120,

  // Quy tắc tổng hợp học kỳ / cả năm
  aggregationMethod: 'single_initial', // Điểm khởi đầu 1 lần cho cả kỳ + Tổng điểm cộng toàn kỳ - Tổng điểm trừ toàn kỳ

  // 4 mức xếp loại rèn luyện chuẩn theo Thông tư Bộ GD&ĐT
  conductTiers: [
    {
      id: 'tot',
      label: 'Tốt',
      minScore: 105,
      description:
        'Thực hiện xuất sắc nội quy trường lớp, kính trọng thầy cô, đoàn kết giúp đỡ bạn bè, tích cực tham gia phong trào thi đua và các hoạt động chung của lớp.',
      additionalRulesEnabled: false,
      maxViolations: 1,
      downgradeTo: 'Khá',
    },
    {
      id: 'kha',
      label: 'Khá',
      minScore: 90,
      description:
        'Thực hiện tốt nội quy nề nếp, có ý thức rèn luyện và xây dựng tập thể, đôi lúc có thiếu sót nhỏ nhưng đã nhanh chóng tiếp thu và tiến bộ.',
      additionalRulesEnabled: false,
      maxViolations: 3,
      downgradeTo: 'Đạt',
    },
    {
      id: 'dat',
      label: 'Đạt',
      minScore: 70,
      description:
        'Cơ bản thực hiện đúng quy định nề nếp, có cố gắng sửa đổi khuyết điểm khi được nhắc nhở, còn một số vi phạm nhẹ.',
      additionalRulesEnabled: false,
      maxViolations: 6,
      downgradeTo: 'Chưa đạt',
    },
    {
      id: 'chuadat',
      label: 'Chưa đạt',
      minScore: 0, // Dưới mức Đạt (< 70)
      description:
        'Ý thức rèn luyện chưa cao, còn thường xuyên vi phạm nội quy trường lớp hoặc chưa chịu sửa đổi khi được giáo viên nhắc nhở.',
      additionalRulesEnabled: false,
    },
  ],

  version: 1,
  updatedAt: new Date().toISOString(),
  appliedAt: '2024-09-01',
};

/**
 * Kiểm tra tính hợp lệ của thang điểm & ngưỡng xếp loại:
 * - Không chồng lấn, không bỏ sót
 * - Xử lý chính xác điểm bằng ngưỡng: Tốt >= N_tot > N_kha > N_dat
 */
export function validateConductTiers(tiers: ConductTierConfig[]): {
  isValid: boolean;
  errorMessage?: string;
} {
  const totTier = tiers.find((t) => t.id === 'tot');
  const khaTier = tiers.find((t) => t.id === 'kha');
  const datTier = tiers.find((t) => t.id === 'dat');

  if (!totTier || !khaTier || !datTier) {
    return {
      isValid: false,
      errorMessage: 'Thiếu cấu hình cho một trong các mức Tốt, Khá hoặc Đạt.',
    };
  }

  if (totTier.minScore <= khaTier.minScore) {
    return {
      isValid: false,
      errorMessage: `Ngưỡng điểm mức "Tốt" (${totTier.minScore}) phải lớn hơn mức "Khá" (${khaTier.minScore}).`,
    };
  }

  if (khaTier.minScore <= datTier.minScore) {
    return {
      isValid: false,
      errorMessage: `Ngưỡng điểm mức "Khá" (${khaTier.minScore}) phải lớn hơn mức "Đạt" (${datTier.minScore}).`,
    };
  }

  return { isValid: true };
}

export interface StudentEvaluationResult {
  initialPoints: number;
  plusPoints: number;
  minusPoints: number; // positive number
  rawTotalPoints: number; // initial + plus - minus
  finalTotalPoints: number; // clamped if min/max enabled
  minScoreApplied: boolean;
  maxScoreApplied: boolean;
  suggestedRating: ConductGrade;
  originalTierRating: ConductGrade;
  isDowngraded: boolean;
  downgradeReason: string | null;
  positiveCount: number;
  negativeCount: number;
}

/**
 * Tính điểm thi đua và xếp loại gợi ý rèn luyện cho học sinh theo cấu hình
 */
export function evaluateStudentEmulation(
  studentId: string,
  periodRecords: DisciplineRecord[],
  config: EmulationConfig = DEFAULT_EMULATION_CONFIG
): StudentEvaluationResult {
  const studentRecords = periodRecords.filter((r) => r.studentId === studentId);

  let plusPoints = 0;
  let minusPoints = 0;
  let positiveCount = 0;
  let negativeCount = 0;

  for (const r of studentRecords) {
    const pts = r.points || 0;
    if (pts > 0) {
      plusPoints += pts;
      positiveCount++;
    } else if (pts < 0) {
      minusPoints += Math.abs(pts);
      negativeCount++;
    }
  }

  const initialPoints = config.initialPoints ?? 100;
  const rawTotalPoints = initialPoints + plusPoints - minusPoints;

  // Áp dụng giới hạn Min/Max nếu được bật
  let finalTotalPoints = rawTotalPoints;
  let minScoreApplied = false;
  let maxScoreApplied = false;

  if (config.enableMinScore && typeof config.minScore === 'number' && finalTotalPoints < config.minScore) {
    finalTotalPoints = config.minScore;
    minScoreApplied = true;
  }

  if (config.enableMaxScore && typeof config.maxScore === 'number' && finalTotalPoints > config.maxScore) {
    finalTotalPoints = config.maxScore;
    maxScoreApplied = true;
  }

  // Xác định mức xếp loại rèn luyện theo ngưỡng điểm
  const totTier = config.conductTiers.find((t) => t.id === 'tot') || DEFAULT_EMULATION_CONFIG.conductTiers[0];
  const khaTier = config.conductTiers.find((t) => t.id === 'kha') || DEFAULT_EMULATION_CONFIG.conductTiers[1];
  const datTier = config.conductTiers.find((t) => t.id === 'dat') || DEFAULT_EMULATION_CONFIG.conductTiers[2];

  let originalTierRating: ConductGrade = 'Chưa đạt';
  let activeTier = config.conductTiers.find((t) => t.id === 'chuadat');

  if (finalTotalPoints >= totTier.minScore) {
    originalTierRating = 'Tốt';
    activeTier = totTier;
  } else if (finalTotalPoints >= khaTier.minScore) {
    originalTierRating = 'Khá';
    activeTier = khaTier;
  } else if (finalTotalPoints >= datTier.minScore) {
    originalTierRating = 'Đạt';
    activeTier = datTier;
  } else {
    originalTierRating = 'Chưa đạt';
  }

  // Kiểm tra điều kiện bổ sung tự động (nếu giáo viên chủ động bật cho mức đó)
  let suggestedRating: ConductGrade = originalTierRating;
  let isDowngraded = false;
  let downgradeReason: string | null = null;

  if (
    activeTier &&
    activeTier.additionalRulesEnabled &&
    typeof activeTier.maxViolations === 'number' &&
    activeTier.downgradeTo
  ) {
    if (negativeCount > activeTier.maxViolations) {
      suggestedRating = activeTier.downgradeTo;
      isDowngraded = true;
      downgradeReason = `Hạ gợi ý từ "${originalTierRating}" xuống "${suggestedRating}" do có ${negativeCount} lần vi phạm nề nếp (vượt mức tối đa ${activeTier.maxViolations} lần cho phép)`;
    }
  }

  return {
    initialPoints,
    plusPoints,
    minusPoints,
    rawTotalPoints,
    finalTotalPoints,
    minScoreApplied,
    maxScoreApplied,
    suggestedRating,
    originalTierRating,
    isDowngraded,
    downgradeReason,
    positiveCount,
    negativeCount,
  };
}

/**
 * Lấy cấu hình thi đua theo từng lớp và năm học (hoặc fallback cấu hình mặc định)
 */
export function getEmulationConfigForClass(
  classConfigs: Record<string, EmulationConfig> | undefined,
  activeConfig: EmulationConfig | undefined,
  className: string,
  schoolYear: string
): EmulationConfig {
  const key = `${className}_${schoolYear}`;
  if (classConfigs && classConfigs[key]) {
    return classConfigs[key];
  }
  if (activeConfig) {
    return activeConfig;
  }
  return DEFAULT_EMULATION_CONFIG;
}
