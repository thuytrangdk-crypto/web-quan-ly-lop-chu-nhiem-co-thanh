export type UserRole = 'teacher' | 'student';

export type AttendanceStatus = 'c' | 'v' | 'm' | 'kp';
// 'c': Có mặt (Present)
// 'v': Vắng có phép (Excused absence)
// 'm': Đi muộn (Late)
// 'kp': Vắng không phép (Unexcused absence)

export interface Student {
  id: string;
  name: string;
  dob: string;
  gender: 'Nam' | 'Nữ';
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  avatar?: string;
  position?: string; // Lớp trưởng, Lớp phó, Tổ trưởng, etc.
  password?: string;
  grades?: Record<string, number>;
  conduct?: string; // Tốt, Khá, Đạt, Chưa đạt
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export interface DisciplineRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  ruleName: string;
  points: number; // positive for praise, negative for violation
  note?: string;
  type: 'plus' | 'minus';
}

export interface NoteRecord {
  id: string;
  studentId: string;
  date: string;
  title: string;
  content: string;
  author: string;
}

export interface BoardNotice {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'high' | 'normal' | 'info';
  pinned: boolean;
  author?: string;
}

export interface ClassConfig {
  appName: string;
  schoolName: string;
  className: string;
  schoolYear: string;
  teacherName: string;
  teacherPassword: string;
  classAvatar?: string;
  availableClasses?: string[];
}

export interface AppState {
  config: ClassConfig;
  students: Student[];
  attendance: AttendanceRecord[];
  discipline: DisciplineRecord[];
  notes: NoteRecord[];
  boardNotices: BoardNotice[];
  seatingChart?: Record<string, string>;
}
