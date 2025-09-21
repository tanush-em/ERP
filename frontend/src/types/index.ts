// Student and Profile Types
export interface Student {
  id: string;
  email: string;
  profile: StudentProfile;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  firstName: string;
  lastName: string;
  department: string;
  phone: string;
  address: Address;
  rollNumber: string;
  year: number;
  semester: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

// Course Types
export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  semester: number;
  faculty: string;
  description: string;
  prerequisites: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: string;
  status: 'enrolled' | 'completed' | 'dropped';
  semester: string;
  academicYear: string;
  course?: Course;
  student?: Student;
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  sessionType: 'theory' | 'lab' | 'tutorial';
  markedBy: string;
  course?: Course;
  student?: Student;
}

export interface AttendancePercentage {
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  percentage: number;
}

export interface AttendanceSummary {
  _id: {
    courseId: string;
    courseName: string;
    courseCode: string;
  };
  totalClasses: number;
  presentClasses: number;
  percentage: number;
}

// Score Types
export interface Score {
  id: string;
  studentId: string;
  courseId: string;
  examType: string;
  marks: number;
  maxMarks: number;
  grade: string;
  examDate: string;
  semester: string;
  course?: Course;
  student?: Student;
}

export interface GPAData {
  gpa: number;
  courses: number;
  totalCredits: number;
  semester?: string;
}

export interface Transcript {
  transcript: Score[];
  semesterGPAs: { [semester: string]: { gpa: number; courses: number } };
  overallGPA: number;
  totalCredits: number;
}

// Timetable Types
export interface TimetableEntry {
  id: string;
  courseId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  sessionType: 'theory' | 'lab' | 'tutorial';
  semester: string;
  course?: Course;
}

export interface WeeklyTimetable {
  [day: string]: TimetableEntry[];
}

// Fee Types
export interface Fee {
  id: string;
  studentId: string;
  feeType: string;
  amount: number;
  dueDate: string;
  academicYear: string;
  description: string;
  isPaid: boolean;
  paymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentReference?: string;
  student?: Student;
}

export interface FeesSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  link?: string;
  metadata?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Types
export interface StudentDashboard {
  student: Student;
  academicInfo: {
    currentSemester: string;
    academicYear: string;
    enrolledCourses: number;
    currentGPA: number;
  };
  courses: Enrollment[];
  attendanceSummary: AttendanceSummary[];
  recentScores: Score[];
  notifications: {
    recent: Notification[];
    unreadCount: number;
  };
  fees: {
    summary: FeesSummary;
    pendingFees: number;
    overdueFees: number;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface FilterOptions {
  search?: string;
  semester?: number;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Error Types
export interface ApiError {
  error: string;
  message: string;
  statusCode?: number;
}