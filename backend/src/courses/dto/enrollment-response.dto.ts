import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentRole } from '@prisma/client';

// Heuristic #6: Recognition Rather Than Recall — clear response structure

export class EnrollmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  userName!: string;

  @ApiProperty()
  userEmail!: string;

  @ApiProperty({ enum: EnrollmentRole })
  role!: EnrollmentRole;

  @ApiProperty()
  joinedAt!: Date;
}

export class ParticipantListResponseDto {
  @ApiProperty()
  courseId!: string;

  @ApiProperty()
  courseName!: string;

  @ApiProperty()
  totalParticipants!: number;

  @ApiProperty({ type: [EnrollmentResponseDto] })
  participants!: EnrollmentResponseDto[];
}
