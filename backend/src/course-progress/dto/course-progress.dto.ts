import { ApiProperty } from '@nestjs/swagger';

export class ProgressBreakdown {
  @ApiProperty()
  materialsCompleted!: number;

  @ApiProperty()
  materialsTotal!: number;

  @ApiProperty()
  assignmentsCompleted!: number;

  @ApiProperty()
  assignmentsTotal!: number;

  @ApiProperty()
  quizzesCompleted!: number;

  @ApiProperty()
  quizzesTotal!: number;

  @ApiProperty()
  examsCompleted!: number;

  @ApiProperty()
  examsTotal!: number;

  @ApiProperty()
  activitiesCompleted!: number;

  @ApiProperty()
  activitiesTotal!: number;
}

export class CourseProgressResponse {
  @ApiProperty()
  courseId!: string;

  @ApiProperty()
  courseName!: string;

  @ApiProperty()
  courseCode!: string;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  studentName!: string;

  @ApiProperty()
  overallProgress!: number;

  @ApiProperty()
  breakdown!: ProgressBreakdown;

  @ApiProperty()
  lastUpdated!: Date;
}

export class StudentProgressListResponse {
  @ApiProperty()
  courseId!: string;

  @ApiProperty()
  courseName!: string;

  @ApiProperty()
  students!: CourseProgressResponse[];

  @ApiProperty()
  averageProgress!: number;

  @ApiProperty()
  atRiskStudents!: number;
}

export class RecalculateProgressDto {
  @ApiProperty()
  courseId!: string;

  @ApiProperty({ required: false })
  studentId?: string;
}
