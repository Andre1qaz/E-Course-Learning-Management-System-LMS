import { IsNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { EnrollmentRole } from '@prisma/client';

// Heuristic #5: Error Prevention — validate direct enrollment data

export class DirectEnrollDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(EnrollmentRole)
  @IsNotEmpty()
  role!: EnrollmentRole;
}
