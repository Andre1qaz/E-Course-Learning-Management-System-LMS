import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { LoginDto, RegisterDto, ForgotPasswordDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<ApiResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        'Email sudah terdaftar. Gunakan email lain atau login.',
      );
    }

    // Heuristic #5: Error Prevention — password hashing, never plain text
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
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
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
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
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return {
        success: true,
        data: null,
        message:
          'Jika email terdaftar, instruksi reset password akan dikirim ke email institusi Anda.',
      };
    }

    // In production: queue email via BullMQ
    return {
      success: true,
      data: null,
      message:
        'Instruksi reset password telah dikirim ke email institusi Anda. Periksa inbox Anda.',
    };
  }

  async getProfile(userId: string): Promise<ApiResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: dto.avatarUrl },
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
        userId: userId,
        action: 'UPDATE_PROFILE',
        entity: 'User',
        entityId: userId,
      },
    });

    return {
      success: true,
      data: updatedUser,
      message: 'Foto profil berhasil diperbarui.',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<ApiResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan.');
    }

    const isPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password lama tidak sesuai.');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new UnauthorizedException('Password baru dan konfirmasi tidak sama.');
    }

    // Password validation: minimal 8 karakter dan kombinasi huruf dan angka
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(dto.newPassword)) {
      throw new UnauthorizedException(
        'Password baru harus minimal 8 karakter dan mengandung kombinasi huruf dan angka.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: userId,
        action: 'CHANGE_PASSWORD',
        entity: 'User',
        entityId: userId,
      },
    });

    return {
      success: true,
      data: null,
      message: 'Password berhasil diperbarui.',
    };
  }
}
