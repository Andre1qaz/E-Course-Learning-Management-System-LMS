import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, EnrollmentRole } from '@prisma/client';

describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: PrismaService,
          useValue: {
            course: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            courseCategory: {
              findUnique: jest.fn(),
            },
            enrollment: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new course successfully as admin', async () => {
      const userId = 'clh1234567890abcdefghijklmnopqrst'; // Valid CUID
      const createCourseDto = {
        name: 'Test Course',
        code: 'TEST101',
        description: 'Test description',
        thumbnailColor: '#1a365d',
      };

      const mockCategory = {
        id: 'clh0987654321zyxwvutsrqponmlkjihgfe', // Valid CUID
        name: 'Test Category',
      };

      const mockCourse = {
        id: 'clhabcdefghijk1234567890lmnopqrstu', // Valid CUID
        name: 'Test Course',
        code: 'TEST101',
        enrollmentCode: 'ABC123',
        instructorId: userId,
        category: mockCategory,
        instructor: { id: userId, name: 'Test Instructor' },
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.courseCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.course.create as jest.Mock).mockResolvedValue(mockCourse);

      const result = await service.create(userId, Role.ADMIN, createCourseDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCourse);
      expect(prisma.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Course',
          code: 'TEST101',
          instructorId: userId,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenException if user is not admin or dosen', async () => {
      const userId = 'clh1234567890abcdefghijklmnopqrst'; // Valid CUID
      const createCourseDto = {
        name: 'Test Course',
        code: 'TEST101',
      };

      await expect(service.create(userId, Role.MAHASISWA, createCourseDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if course code already exists', async () => {
      const userId = 'clh1234567890abcdefghijklmnopqrst'; // Valid CUID
      const createCourseDto = {
        name: 'Test Course',
        code: 'TEST101',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'clhexistingcourse1234567890abcdefghijklmnop', // Valid CUID
        code: 'TEST101',
      });

      await expect(service.create(userId, Role.ADMIN, createCourseDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if category ID is invalid', async () => {
      const userId = 'clh1234567890abcdefghijklmnopqrst'; // Valid CUID
      const createCourseDto = {
        name: 'Test Course',
        code: 'TEST101',
        categoryId: 'invalid-category-id', // Invalid CUID
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create(userId, Role.ADMIN, createCourseDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return course by ID for admin', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const mockCourse = {
        id: courseId,
        name: 'Test Course',
        instructorId: userId,
        category: { id: 'category-1', name: 'Test Category' },
        instructor: { id: userId, name: 'Test Instructor', email: 'test@example.com' },
        modules: [],
        assignments: [],
        exams: [],
        _count: { enrollments: 10, modules: 5, assignments: 3, exams: 2 },
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findOne(courseId, userId, Role.ADMIN);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCourse);
    });

    it('should throw NotFoundException if course not found', async () => {
      const courseId = 'nonexistent-course';
      const userId = 'user-1';

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(courseId, userId, Role.ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user has no access', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const mockCourse = {
        id: courseId,
        name: 'Test Course',
        instructorId: 'different-user',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(courseId, userId, Role.MAHASISWA)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update course successfully as instructor', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const updateCourseDto = {
        name: 'Updated Course Name',
      };

      const mockCourse = {
        id: courseId,
        name: 'Test Course',
        instructorId: userId,
      };

      const mockUpdatedCourse = {
        id: courseId,
        name: 'Updated Course Name',
        instructorId: userId,
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (prisma.course.update as jest.Mock).mockResolvedValue(mockUpdatedCourse);

      const result = await service.update(courseId, userId, Role.DOSEN, updateCourseDto);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Course Name');
    });

    it('should throw ForbiddenException if user is not admin or instructor', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const updateCourseDto = {
        name: 'Updated Course Name',
      };

      const mockCourse = {
        id: courseId,
        instructorId: 'different-user',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      await expect(service.update(courseId, userId, Role.MAHASISWA, updateCourseDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if new code conflicts with existing course', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const updateCourseDto = {
        code: 'EXISTING101',
      };

      const mockCourse = {
        id: courseId,
        code: 'OLD101',
        instructorId: userId,
      };

      (prisma.course.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce({ id: 'other-course', code: 'EXISTING101' });

      await expect(service.update(courseId, userId, Role.DOSEN, updateCourseDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete course successfully as admin', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const mockCourse = {
        id: courseId,
        instructorId: 'different-user',
        _count: { enrollments: 0, modules: 0, assignments: 0, exams: 0 },
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (prisma.course.delete as jest.Mock).mockResolvedValue({});

      const result = await service.remove(courseId, userId, Role.ADMIN);

      expect(result.success).toBe(true);
      expect(prisma.course.delete).toHaveBeenCalledWith({ where: { id: courseId } });
    });

    it('should throw ForbiddenException if instructor tries to delete course with enrollments', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const mockCourse = {
        id: courseId,
        instructorId: userId,
        _count: { enrollments: 5, modules: 0, assignments: 0, exams: 0 },
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      await expect(service.remove(courseId, userId, Role.DOSEN)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('enroll', () => {
    it('should enroll user in course successfully', async () => {
      const userId = 'user-1';
      const enrollDto = {
        enrollmentCode: 'ABC123',
      };

      const mockCourse = {
        id: 'course-1',
        name: 'Test Course',
        enrollmentCode: 'ABC123',
        enrollmentEnabled: true,
        enrollments: [],
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (prisma.enrollment.create as jest.Mock).mockResolvedValue({});

      const result = await service.enroll(userId, enrollDto);

      expect(result.success).toBe(true);
      expect(result.data.courseId).toBe('course-1');
    });

    it('should throw NotFoundException for invalid enrollment code', async () => {
      const userId = 'user-1';
      const enrollDto = {
        enrollmentCode: 'INVALID',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.enroll(userId, enrollDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if enrollment is disabled', async () => {
      const userId = 'user-1';
      const enrollDto = {
        enrollmentCode: 'ABC123',
      };

      const mockCourse = {
        id: 'course-1',
        enrollmentCode: 'ABC123',
        enrollmentEnabled: false,
        enrollments: [],
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      await expect(service.enroll(userId, enrollDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if already enrolled', async () => {
      const userId = 'user-1';
      const enrollDto = {
        enrollmentCode: 'ABC123',
      };

      const mockCourse = {
        id: 'course-1',
        enrollmentCode: 'ABC123',
        enrollmentEnabled: true,
        enrollments: [{ userId }],
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      await expect(service.enroll(userId, enrollDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('unenroll', () => {
    it('should unenroll user from course successfully', async () => {
      const userId = 'user-1';
      const courseId = 'course-1';
      const mockEnrollment = {
        id: 'enrollment-1',
        userId,
        courseId,
      };

      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollment);
      (prisma.enrollment.delete as jest.Mock).mockResolvedValue({});

      const result = await service.unenroll(userId, courseId);

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      const userId = 'user-1';
      const courseId = 'course-1';

      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.unenroll(userId, courseId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all courses for admin', async () => {
      const userId = 'user-1';
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Course 1',
          instructor: { id: 'instructor-1', name: 'Instructor 1' },
          category: { id: 'category-1', name: 'Category 1' },
          _count: { enrollments: 10, modules: 5, assignments: 3, exams: 2 },
        },
      ];

      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

      const result = await service.findAll(userId, Role.ADMIN);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCourses);
    });

    it('should return only instructor courses for dosen', async () => {
      const userId = 'instructor-1';
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Course 1',
          instructorId: userId,
        },
      ];

      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

      const result = await service.findAll(userId, Role.DOSEN);

      expect(result.success).toBe(true);
      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: { instructorId: userId },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should return only enrolled courses for student', async () => {
      const userId = 'student-1';
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Course 1',
        },
      ];

      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

      const result = await service.findAll(userId, Role.MAHASISWA);

      expect(result.success).toBe(true);
      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: { enrollments: { some: { userId } } },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should apply search filter', async () => {
      const userId = 'user-1';
      const mockCourses = [];

      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

      await service.findAll(userId, Role.ADMIN, { search: 'math' });

      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.any(Object) }),
            expect.objectContaining({ code: expect.any(Object) }),
          ]),
        }),
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('getAvailableCourses', () => {
    it('should return available courses for student', async () => {
      const userId = 'student-1';
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Available Course',
          isActive: true,
          enrollmentEnabled: true,
        },
      ];

      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

      const result = await service.getAvailableCourses(userId);

      expect(result.success).toBe(true);
      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          isActive: true,
          enrollmentEnabled: true,
          enrollments: { none: { userId } },
        }),
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('directEnroll', () => {
    it('should directly enroll student as admin', async () => {
      const courseId = 'course-1';
      const userId = 'admin-1';
      const directEnrollDto = {
        userId: 'student-1',
        role: EnrollmentRole.STUDENT,
      };

      const mockCourse = {
        id: courseId,
        instructorId: 'instructor-1',
      };

      const mockTargetUser = {
        id: 'student-1',
        name: 'Student User',
        role: Role.MAHASISWA,
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockTargetUser);
      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.enrollment.create as jest.Mock).mockResolvedValue({});

      const result = await service.directEnroll(courseId, userId, Role.ADMIN, directEnrollDto);

      expect(result.success).toBe(true);
    });

    it('should throw ForbiddenException if target user is not a student', async () => {
      const courseId = 'course-1';
      const userId = 'admin-1';
      const directEnrollDto = {
        userId: 'other-dosen',
        role: EnrollmentRole.STUDENT,
      };

      const mockCourse = { id: courseId };
      const mockTargetUser = {
        id: 'other-dosen',
        role: Role.DOSEN,
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockTargetUser);

      await expect(service.directEnroll(courseId, userId, Role.ADMIN, directEnrollDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getParticipants', () => {
    it('should return course participants as instructor', async () => {
      const courseId = 'course-1';
      const userId = 'instructor-1';
      const mockCourse = {
        id: courseId,
        instructorId: userId,
        name: 'Test Course',
      };

      const mockEnrollments = [
        {
          id: 'enrollment-1',
          userId: 'student-1',
          user: { id: 'student-1', name: 'Student 1', email: 'student1@example.com' },
          role: EnrollmentRole.STUDENT,
          joinedAt: new Date(),
        },
      ];

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (prisma.enrollment.findMany as jest.Mock).mockResolvedValue(mockEnrollments);

      const result = await service.getParticipants(courseId, userId, Role.DOSEN);

      expect(result.success).toBe(true);
      expect(result.data.participants).toHaveLength(1);
    });

    it('should throw ForbiddenException if user is not admin or instructor', async () => {
      const courseId = 'course-1';
      const userId = 'student-1';
      const mockCourse = {
        id: courseId,
        instructorId: 'instructor-1',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      await expect(service.getParticipants(courseId, userId, Role.MAHASISWA)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant successfully as instructor', async () => {
      const courseId = 'course-1';
      const participantId = 'enrollment-1';
      const userId = 'instructor-1';

      const mockCourse = {
        id: courseId,
        instructorId: userId,
      };

      const mockEnrollment = {
        id: participantId,
        courseId,
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollment);
      (prisma.enrollment.delete as jest.Mock).mockResolvedValue({});

      const result = await service.removeParticipant(courseId, participantId, userId, Role.DOSEN);

      expect(result.success).toBe(true);
    });
  });
});