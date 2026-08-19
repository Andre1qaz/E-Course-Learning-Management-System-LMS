export interface EnrollmentWithCourse {
  userId: string;
  courseId: string;
  role: string;
  joinedAt: Date;
  course: {
    id: string;
    name: string;
    code: string;
    settings: any;
  };
}

export type StudentGradeResult = {
  id: string;
  courseId: string;
  studentId: string;
  assignmentScore: number | null;
  quizScore: number | null;
  utsScore: number | null;
  uasScore: number | null;
  otherScore: number | null;
  finalScore: number | null;
  passed: boolean | null;
  completionPercentage: number;
  calculatedAt: Date;
  updatedAt: Date;
  course?: {
    id: string;
    name: string;
    code: string;
    settings: any;
  } | null;
  student?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface EnrollmentWithGrade {
  course: {
    id: string;
    name: string;
    code: string;
    settings: any;
  };
  grade: StudentGradeResult | null;
}

export interface BulkGradeUpdateResult {
  studentId: string;
  success: boolean;
  error?: string;
}
