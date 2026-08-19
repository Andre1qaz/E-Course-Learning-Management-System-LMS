import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { LoginDto, RegisterDto, ForgotPasswordDto, UpdateProfileDto, ChangePasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { AutoValidator } from '../common/base/validation-guide';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<ApiResponse> {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      name: { type: 'string', required: true, maxLength: 100 },
      email: { type: 'string', required: true, maxLength: 255 },
      password: { type: 'string', required: true, minLength: 8, maxLength: 100 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate password format
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(result.sanitized.password)) {
      throw new BadRequestException(
        'Password harus minimal 8 karakter dan mengandung kombinasi huruf dan angka.',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: result.sanitized.email },
    });

    if (existing) {
      throw new ConflictException(
        'Email sudah terdaftar. Gunakan email lain atau login.',
      );
    }

    // Heuristic #5: Error Prevention — password hashing, never plain text
    const hashedPassword = await bcrypt.hash(result.sanitized.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: result.sanitized.name,
        email: result.sanitized.email,
        password: hashedPassword,
        role: Role.MAHASISWA,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entity: 'User',
        entityId: user.id,
      },
    });

    return {
      success: true,
      data: user,
      message: 'Registrasi berhasil. Silakan login.',
    };
  }

  async login(dto: LoginDto): Promise<ApiResponse> {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      email: { type: 'string', required: true, maxLength: 255 },
      password: { type: 'string', required: true, maxLength: 100 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    const user = await this.prisma.user.findUnique({
      where: { email: result.sanitized.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    const isPasswordValid = await bcrypt.compare(result.sanitized.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
      },
    });

    return {
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      message: 'Login berhasil.',
    };
  }

  // Heuristic #2: Match Between System and the Real World — simple institutional email flow
  async forgotPassword(dto: ForgotPasswordDto): Promise<ApiResponse> {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      email: { type: 'string', required: true, maxLength: 255 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    const user = await this.prisma.user.findUnique({
      where: { email: result.sanitized.email },
    });

    if (!user) {
      return {
        success: true,
        data: null,
        message:
          'Jika email terdaftar, instruksi reset password akan dikirim ke email institusi Anda.',
      };
    }

    // Generate reset token
    const resetToken = this.generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // In production: queue email via BullMQ with reset token
    // For now, we'll return the token in the response for testing purposes
    return {
      success: true,
      data: { resetToken }, // Only for development - remove in production
      message:
        `Instruksi reset password telah dikirim ke email institusi Anda. Periksa inbox Anda. Token: ${resetToken}`,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<ApiResponse> {
    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      token: { type: 'string', required: true, maxLength: 100 },
      newPassword: { type: 'string', required: true, minLength: 8, maxLength: 100 },
      confirmPassword: { type: 'string', required: true, minLength: 8, maxLength: 100 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate password format
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(result.sanitized.newPassword)) {
      throw new BadRequestException(
        'Password baru harus minimal 8 karakter dan mengandung kombinasi huruf dan angka.',
      );
    }

    // ✅ Validate password confirmation
    if (result.sanitized.newPassword !== result.sanitized.confirmPassword) {
      throw new BadRequestException('Password baru dan konfirmasi tidak sama.');
    }

    const user = await this.prisma.user.findUnique({
      where: { resetToken: result.sanitized.token },
    });

    if (!user) {
      throw new UnauthorizedException('Token reset tidak valid atau telah kadaluarsa.');
    }

    if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
      throw new UnauthorizedException('Token reset telah kadaluarsa. Silakan minta token baru.');
    }

    const hashedPassword = await bcrypt.hash(result.sanitized.newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'RESET_PASSWORD',
        entity: 'User',
        entityId: user.id,
      },
    });

    return {
      success: true,
      data: null,
      message: 'Password berhasil direset. Silakan login dengan password baru.',
    };
  }

  private generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async getProfile(userId: string): Promise<ApiResponse> {
    // ✅ Validate userId dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');

    const user = await this.prisma.user.findUnique({
      where: { id: validatedUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        storageQuotaUsed: true,
        storageQuotaLimit: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: user
        ? {
            ...user,
            storageQuotaUsed: user.storageQuotaUsed.toString(),
            storageQuotaLimit: user.storageQuotaLimit.toString(),
          }
        : null,
      message: 'Profil berhasil diambil.',
    };
  }

  async listUsers(): Promise<ApiResponse> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: users,
      message: 'Daftar pengguna berhasil diambil.',
    };
  }

  async listActivityLogs(): Promise<ApiResponse> {
    const logs = await this.prisma.activityLog.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      success: true,
      data: logs,
      message: 'Log aktivitas berhasil diambil.',
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ApiResponse> {
    // ✅ Validate userId dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');

    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      avatarUrl: { type: 'string', required: true, maxLength: 500 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    const user = await this.prisma.user.findUnique({
      where: { id: validatedUserId },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: validatedUserId },
      data: { avatarUrl: result.sanitized.avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: validatedUserId,
        action: 'UPDATE_PROFILE',
        entity: 'User',
        entityId: validatedUserId,
      },
    });

    return {
      success: true,
      data: updatedUser,
      message: 'Foto profil berhasil diperbarui.',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<ApiResponse> {
    // ✅ Validate userId dengan AutoValidator
    const validatedUserId = AutoValidator.validateUUID(userId, 'User ID');

    // ✅ Auto-validation semua field dengan AutoValidator
    const result = AutoValidator.validateObject(dto, {
      oldPassword: { type: 'string', required: true, maxLength: 100 },
      newPassword: { type: 'string', required: true, minLength: 8, maxLength: 100 },
      confirmPassword: { type: 'string', required: true, minLength: 8, maxLength: 100 },
    });

    if (!result.valid) {
      throw new BadRequestException(result.errors.join(', '));
    }

    // ✅ Validate password format
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(result.sanitized.newPassword)) {
      throw new BadRequestException(
        'Password baru harus minimal 8 karakter dan mengandung kombinasi huruf dan angka.',
      );
    }

    // ✅ Validate password confirmation
    if (result.sanitized.newPassword !== result.sanitized.confirmPassword) {
      throw new BadRequestException('Password baru dan konfirmasi tidak sama.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: validatedUserId },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan.');
    }

    const isPasswordValid = await bcrypt.compare(result.sanitized.oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password lama tidak sesuai.');
    }

    const hashedPassword = await bcrypt.hash(result.sanitized.newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: validatedUserId },
      data: { password: hashedPassword },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: validatedUserId,
        action: 'CHANGE_PASSWORD',
        entity: 'User',
        entityId: validatedUserId,
      },
    });

    return {
      success: true,
      data: null,
      message: 'Password berhasil diperbarui.',
    };
  }
}
