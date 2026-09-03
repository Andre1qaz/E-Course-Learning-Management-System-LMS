import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    getProfile: jest.fn(),
    listUsers: jest.fn(),
    createUser: jest.fn(),
    listActivityLogs: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123',
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          role: Role.MAHASISWA,
        },
        message: 'Registrasi berhasil. Silakan login.',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockResponse);
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'TestPassword123',
      };

      const mockResponse = {
        success: true,
        data: {
          accessToken: 'jwt-token',
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            role: Role.MAHASISWA,
          },
        },
        message: 'Login berhasil.',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockResponse);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset', async () => {
      const forgotPasswordDto = {
        email: 'test@example.com',
      };

      const mockResponse = {
        success: true,
        data: { resetToken: 'reset-token' },
        message: 'Instruksi reset password telah dikirim ke email institusi Anda.',
      };

      mockAuthService.forgotPassword.mockResolvedValue(mockResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toEqual(mockResponse);
      expect(service.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const resetPasswordDto = {
        token: 'valid-token',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const mockResponse = {
        success: true,
        data: null,
        message: 'Password berhasil direset. Silakan login dengan password baru.',
      };

      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toEqual(mockResponse);
      expect(service.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userId = 'user-1';

      const mockResponse = {
        success: true,
        data: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
          role: Role.MAHASISWA,
        },
        message: 'Profil berhasil diambil.',
      };

      mockAuthService.getProfile.mockResolvedValue(mockResponse);

      const result = await controller.getProfile(userId);

      expect(result).toEqual(mockResponse);
      expect(service.getProfile).toHaveBeenCalledWith(userId);
    });
  });

  describe('listUsers', () => {
    it('should return list of users', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'user-1',
            name: 'User 1',
            email: 'user1@example.com',
            role: Role.MAHASISWA,
          },
        ],
        message: 'Daftar pengguna berhasil diambil.',
      };

      mockAuthService.listUsers.mockResolvedValue(mockResponse);

      const result = await controller.listUsers();

      expect(result).toEqual(mockResponse);
      expect(service.listUsers).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'TestPassword123',
        role: 'DOSEN',
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'user-2',
          name: 'New User',
          email: 'newuser@example.com',
          role: Role.DOSEN,
        },
        message: 'User berhasil dibuat.',
      };

      mockAuthService.createUser.mockResolvedValue(mockResponse);

      const result = await controller.createUser(createUserDto);

      expect(result).toEqual(mockResponse);
      expect(service.createUser).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('listActivityLogs', () => {
    it('should return activity logs', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'log-1',
            action: 'LOGIN',
            user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
          },
        ],
        message: 'Log aktivitas berhasil diambil.',
      };

      mockAuthService.listActivityLogs.mockResolvedValue(mockResponse);

      const result = await controller.listActivityLogs();

      expect(result).toEqual(mockResponse);
      expect(service.listActivityLogs).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user-1';
      const updateProfileDto = {
        avatarUrl: 'http://example.com/new-avatar.jpg',
      };

      const mockResponse = {
        success: true,
        data: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
          role: Role.MAHASISWA,
          avatarUrl: 'http://example.com/new-avatar.jpg',
        },
        message: 'Foto profil berhasil diperbarui.',
      };

      mockAuthService.updateProfile.mockResolvedValue(mockResponse);

      const result = await controller.updateProfile(userId, updateProfileDto);

      expect(result).toEqual(mockResponse);
      expect(service.updateProfile).toHaveBeenCalledWith(userId, updateProfileDto);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const userId = 'user-1';
      const changePasswordDto = {
        oldPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const mockResponse = {
        success: true,
        data: null,
        message: 'Password berhasil diperbarui.',
      };

      mockAuthService.changePassword.mockResolvedValue(mockResponse);

      const result = await controller.changePassword(userId, changePasswordDto);

      expect(result).toEqual(mockResponse);
      expect(service.changePassword).toHaveBeenCalledWith(userId, changePasswordDto);
    });
  });
});