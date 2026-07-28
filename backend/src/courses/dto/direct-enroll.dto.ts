import { IsString, IsNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { EnrollmentRole } from '@prisma/client';

// Heuristic #5: Error Prevention — validate direct enrollment data

export class DirectEnrollDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsEnum(EnrollmentRole)
  @IsNotEmpty()
  role: EnrollmentRole;
}
