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

export interface StudentGradeResult {
  courseId: string;
  studentId: string;
  assignmentScore: number;
  quizScore: number;
  utsScore: number;
  uasScore: number;
  finalGrade: number;
  letterGrade: string;
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
