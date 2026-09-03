import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '@prisma/client';

export class LoginDto {
  @ApiProperty({ example: 'mahasiswa1@ecourse.ac.id' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty({ message: 'Nama wajib diisi' })
  name!: string;

  @ApiProperty({ example: 'budi@ecourse.ac.id' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message:
      'Password harus minimal 8 karakter dan mengandung kombinasi huruf dan angka',
  })
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'budi@ecourse.ac.id' })
  @IsEmail({}, { message: 'Format email institusi tidak valid' })
  email!: string;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsNotEmpty({ message: 'URL avatar wajib diisi' })
  avatarUrl!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'Password lama wajib diisi' })
  oldPassword!: string;

  @ApiProperty({ example: 'NewPassword456!' })
  @IsString()
  @IsNotEmpty({ message: 'Password baru wajib diisi' })
  @MinLength(8, { message: 'Password baru minimal 8 karakter' })
  newPassword!: string;

  @ApiProperty({ example: 'NewPassword456!' })
  @IsString()
  @IsNotEmpty({ message: 'Konfirmasi password wajib diisi' })
  confirmPassword!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123xyz' })
  @IsString()
  @IsNotEmpty({ message: 'Token reset wajib diisi' })
  token!: string;

  @ApiProperty({ example: 'NewPassword456!' })
  @IsString()
  @IsNotEmpty({ message: 'Password baru wajib diisi' })
  @MinLength(8, { message: 'Password baru minimal 8 karakter' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message:
      'Password harus minimal 8 karakter dan mengandung kombinasi huruf dan angka',
  })
  newPassword!: string;

  @ApiProperty({ example: 'NewPassword456!' })
  @IsString()
  @IsNotEmpty({ message: 'Konfirmasi password wajib diisi' })
  confirmPassword!: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'Dr. Ahmad Wijaya' })
  @IsString()
  @IsNotEmpty({ message: 'Nama wajib diisi' })
  name!: string;

  @ApiProperty({ example: 'ahmad@ecourse.ac.id' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message:
      'Password harus minimal 8 karakter dan mengandung kombinasi huruf dan angka',
  })
  password!: string;

  @ApiProperty({ example: 'DOSEN', enum: Role })
  @IsEnum(Role, {
    message: 'Role harus salah satu dari: ADMIN, DOSEN, MAHASISWA',
  })
  @IsNotEmpty({ message: 'Role wajib diisi' })
  role!: Role;
}
