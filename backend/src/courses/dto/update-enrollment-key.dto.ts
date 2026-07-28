import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

// Heuristic #5: Error Prevention — validate enrollment key updates

export class UpdateEnrollmentKeyDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  enrollmentCode?: string;

  @IsBoolean()
  @IsOptional()
  enrollmentEnabled?: boolean;
}
