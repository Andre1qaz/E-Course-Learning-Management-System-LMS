import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { TestHelpers } from '../test-utils/test-helpers.util';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let bcrypt: any;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
            },
            activityLog: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    bcrypt = require('bcrypt');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue('$2b$12$hashedPassword');
    bcrypt.compare.mockResolvedValue(true);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123',
      };

      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: Role.MAHASISWA,
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(result.message).toBe('Registrasi berhasil. Silakan login.');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          role: Role.MAHASISWA,
        }),
        select: expect.any(Object),
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException for invalid password format', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak', // Invalid password
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for validation errors', async () => {
      const registerDto = {
        name: '', // Invalid name
        email: 'invalid-email',
        password: 'TestPassword123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'TestPassword123',
      };

      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        password: '$2b$12$hashedPassword', // Mock hashed password
        role: Role.MAHASISWA,
      };

      const mockToken = 'jwt-token';
      const mockActivityLog = { id: 'log-1' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue(mockToken);
      (prisma.activityLog.create as jest.Mock).mockResolvedValue(mockActivityLog);

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe(mockToken);
      expect(result.data.user).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
      });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword123',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: '$2b$12$hashedPassword',
        role: Role.MAHASISWA,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userId = 'clh1234567890abcdefghijklmnopqrst'; // Valid CUID
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: Role.MAHASISWA,
        avatarUrl: 'http://example.com/avatar.jpg',
        storageQuotaUsed: BigInt(1024),
        storageQuotaLimit: BigInt(52428800),
        createdAt: new Date(),
      };

      // Mock the validateUUID method to return the ID directly
      jest.spyOn(require('../common/base/validation-guide').AutoValidator, 'validateUUID').mockReturnValue(userId);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...mockUser,
        storageQuotaUsed: mockUser.storageQuotaUsed.toString(),
        storageQuotaLimit: mockUser.storageQuotaLimit.toString(),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'clh1234567890abcdefghijklmnopqrst'; // Valid CUID

      // Mock the validateUUID method to return the ID directly
      jest.spyOn(require('../common/base/validation-guide').AutoValidator, 'validateUUID').mockReturnValue(userId);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'clh1234567890abcdefghijklmnopqrst'; // Valid CUID
      const updateDto = {
        avatarUrl: 'http://example.com/new-avatar.jpg',
      };

      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: Role.MAHASISWA,
        avatarUrl: 'http://example.com/new-avatar.jpg',
      };

      // Mock the validateUUID method to return the ID directly
      jest.spyOn(require('../common/base/validation-guide').AutoValidator, 'validateUUID').mockReturnValue(userId);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

      const result = await service.updateProfile(userId, updateDto);

      expect(result.success).toBe(true);
      expect(result.data.avatarUrl).toBe(updateDto.avatarUrl);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const userId = 'clh1234567890abcdefghijklmnopqrst'; // Valid CUID
      const updateDto = {
        avatarUrl: 'http://example.com/new-avatar.jpg',
      };

      // Mock the validateUUID method to return the ID directly
      jest.spyOn(require('../common/base/validation-guide').AutoValidator, 'validateUUID').mockReturnValue(userId);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 'clh1234567890abcdefghijklmnopqrst'; // Valid CUID
      const changePasswordDto = {
        oldPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const mockUser = {
        id: userId,
        password: '$2b$12$hashedOldPassword',
      };

      // Mock the validateUUID method to return the ID directly
      jest.spyOn(require('../common/base/validation-guide').AutoValidator, 'validateUUID').mockReturnValue(userId);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.activityLog.create as jest.Mock).mockResolvedValue({});
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('$2b$12$hashedNewPassword');

      const result = await service.changePassword(userId, changePasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password berhasil diperbarui.');
    });

    it('should throw BadRequestException if password confirmation does not match', async () => {
      const userId = 'clh1234567890abcdefghijklmnopqrst'; // Valid CUID
      const changePasswordDto = {
        oldPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'DifferentPassword123',
      };

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if old password is incorrect', async () => {
      const userId = 'clh1234567890abcdefghijklmnopqrst'; // Valid CUID
      const changePasswordDto = {
        oldPassword: 'WrongOldPassword',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const mockUser = {
        id: userId,
        password: '$2b$12$hashedOldPassword',
      };

      // Mock the validateUUID method to return the ID directly
      jest.spyOn(require('../common/base/validation-guide').AutoValidator, 'validateUUID').mockReturnValue(userId);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for existing user', async () => {
      const forgotPasswordDto = {
        email: 'test@example.com',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('resetToken');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          resetToken: expect.any(String),
          resetTokenExpires: expect.any(Date),
        }),
      });
    });

    it('should return success message even for non-existent user (security)', async () => {
      const forgotPasswordDto = {
        email: 'nonexistent@example.com',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.message).toContain('Jika email terdaftar');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const resetPasswordDto = {
        token: 'valid-reset-token',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const mockUser = {
        id: 'user-1',
        resetToken: 'valid-reset-token',
        resetTokenExpires: new Date(Date.now() + 3600000),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.activityLog.create as jest.Mock).mockResolvedValue({});
      bcrypt.hash.mockResolvedValue('$2b$12$hashedNewPassword');

      const result = await service.resetPassword(resetPasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password berhasil direset. Silakan login dengan password baru.');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const resetPasswordDto = {
        token: 'invalid-token',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const resetPasswordDto = {
        token: 'expired-token',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const mockUser = {
        id: 'user-1',
        resetToken: 'expired-token',
        resetTokenExpires: new Date(Date.now() - 3600000), // Expired
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('createUser', () => {
    it('should create a new user as admin', async () => {
      const createUserDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'TestPassword123',
        role: 'DOSEN',
      };

      const mockUser = {
        id: 'user-2',
        name: 'New User',
        email: 'newuser@example.com',
        role: Role.DOSEN,
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

      const result = await service.createUser(createUserDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });

    it('should throw BadRequestException for invalid role', async () => {
      const createUserDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'TestPassword123',
        role: 'INVALID_ROLE',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listUsers', () => {
    it('should return list of users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          name: 'User 1',
          email: 'user1@example.com',
          role: Role.MAHASISWA,
          createdAt: new Date(),
        },
        {
          id: 'user-2',
          name: 'User 2',
          email: 'user2@example.com',
          role: Role.DOSEN,
          createdAt: new Date(),
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.listUsers();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('listActivityLogs', () => {
    it('should return list of activity logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'LOGIN',
          entity: 'User',
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
          },
          createdAt: new Date(),
        },
      ];

      (prisma.activityLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

      const result = await service.listActivityLogs();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLogs);
      expect(prisma.activityLog.findMany).toHaveBeenCalledWith({
        include: { user: { select: expect.any(Object) } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });
});