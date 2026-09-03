import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCoursesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    enroll: jest.fn(),
    unenroll: jest.fn(),
    directEnroll: jest.fn(),
    updateEnrollmentKey: jest.fn(),
    getParticipants: jest.fn(),
    removeParticipant: jest.fn(),
    getAvailableCourses: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return courses for dashboard', async () => {
      const userId = 'user-1';
      const role = Role.MAHASISWA;

      const mockResponse = {
        success: true,
        data: [
          {
            id: 'course-1',
            name: 'Course 1',
            code: 'COURSE101',
          },
        ],
        message: 'Courses retrieved successfully',
      };

      mockCoursesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.getDashboard(userId, role);

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalledWith(userId, role);
    });
  });

  describe('getAvailableCourses', () => {
    it('should return available courses for students', async () => {
      const userId = 'user-1';
      const search = 'math';

      const mockResponse = {
        success: true,
        data: [
          {
            id: 'course-1',
            name: 'Math Course',
            code: 'MATH101',
          },
        ],
        message: 'Available courses retrieved successfully',
      };

      mockCoursesService.getAvailableCourses.mockResolvedValue(mockResponse);

      const result = await controller.getAvailableCourses(userId, search);

      expect(result).toEqual(mockResponse);
      expect(service.getAvailableCourses).toHaveBeenCalledWith(userId, { search });
    });
  });

  describe('findAll', () => {
    it('should return all courses with filters', async () => {
      const userId = 'user-1';
      const role = Role.ADMIN;
      const search = 'science';
      const categoryId = 'category-1';
      const isActive = 'true';

      const mockResponse = {
        success: true,
        data: [],
        message: 'Courses retrieved successfully',
      };

      mockCoursesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(userId, role, search, categoryId, isActive);

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalledWith(userId, role, {
        search,
        categoryId,
        isActive: true,
      });
    });
  });

  describe('findOne', () => {
    it('should return course by ID', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const role = Role.MAHASISWA;

      const mockResponse = {
        success: true,
        data: {
          id: courseId,
          name: 'Course 1',
        },
        message: 'Course retrieved successfully',
      };

      mockCoursesService.findOne.mockResolvedValue(mockResponse);

      const result = await controller.findOne(courseId, userId, role);

      expect(result).toEqual(mockResponse);
      expect(service.findOne).toHaveBeenCalledWith(courseId, userId, role);
    });
  });

  describe('create', () => {
    it('should create a new course', async () => {
      const userId = 'user-1';
      const role = Role.DOSEN;
      const createCourseDto = {
        name: 'New Course',
        code: 'NEW101',
        description: 'Course description',
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'course-1',
          name: 'New Course',
          code: 'NEW101',
        },
        message: 'Course created successfully',
      };

      mockCoursesService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createCourseDto, userId, role);

      expect(result).toEqual(mockResponse);
      expect(service.create).toHaveBeenCalledWith(userId, role, createCourseDto);
    });
  });

  describe('update', () => {
    it('should update a course', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const role = Role.DOSEN;
      const updateCourseDto = {
        name: 'Updated Course',
      };

      const mockResponse = {
        success: true,
        data: {
          id: courseId,
          name: 'Updated Course',
        },
        message: 'Course updated successfully',
      };

      mockCoursesService.update.mockResolvedValue(mockResponse);

      const result = await controller.update(courseId, updateCourseDto, userId, role);

      expect(result).toEqual(mockResponse);
      expect(service.update).toHaveBeenCalledWith(courseId, userId, role, updateCourseDto);
    });
  });

  describe('remove', () => {
    it('should delete a course', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const role = Role.ADMIN;

      const mockResponse = {
        success: true,
        data: null,
        message: 'Course deleted successfully',
      };

      mockCoursesService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove(courseId, userId, role);

      expect(result).toEqual(mockResponse);
      expect(service.remove).toHaveBeenCalledWith(courseId, userId, role);
    });
  });

  describe('enroll', () => {
    it('should enroll user in course', async () => {
      const userId = 'user-1';
      const enrollDto = {
        enrollmentCode: 'ABC123',
      };

      const mockResponse = {
        success: true,
        data: {
          courseId: 'course-1',
          courseName: 'Course 1',
        },
        message: 'Successfully enrolled in course',
      };

      mockCoursesService.enroll.mockResolvedValue(mockResponse);

      const result = await controller.enroll(enrollDto, userId);

      expect(result).toEqual(mockResponse);
      expect(service.enroll).toHaveBeenCalledWith(userId, enrollDto);
    });
  });

  describe('unenroll', () => {
    it('should unenroll user from course', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';

      const mockResponse = {
        success: true,
        data: null,
        message: 'Successfully unenrolled from course',
      };

      mockCoursesService.unenroll.mockResolvedValue(mockResponse);

      const result = await controller.unenroll(courseId, userId);

      expect(result).toEqual(mockResponse);
      expect(service.unenroll).toHaveBeenCalledWith(userId, courseId);
    });
  });

  describe('directEnroll', () => {
    it('should directly enroll user in course', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const role = Role.ADMIN;
      const directEnrollDto = {
        userId: 'student-1',
        role: 'STUDENT',
      };

      const mockResponse = {
        success: true,
        data: {
          courseId,
          userId: 'student-1',
          userName: 'Student User',
        },
        message: 'Student enrolled successfully',
      };

      mockCoursesService.directEnroll.mockResolvedValue(mockResponse);

      const result = await controller.directEnroll(courseId, directEnrollDto, userId, role);

      expect(result).toEqual(mockResponse);
      expect(service.directEnroll).toHaveBeenCalledWith(courseId, userId, role, directEnrollDto);
    });
  });

  describe('updateEnrollmentKey', () => {
    it('should update enrollment key', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const role = Role.DOSEN;
      const updateEnrollmentKeyDto = {
        enrollmentCode: 'NEW123',
        enrollmentEnabled: true,
      };

      const mockResponse = {
        success: true,
        data: {
          enrollmentCode: 'NEW123',
          enrollmentEnabled: true,
        },
        message: 'Enrollment key updated successfully',
      };

      mockCoursesService.updateEnrollmentKey.mockResolvedValue(mockResponse);

      const result = await controller.updateEnrollmentKey(courseId, updateEnrollmentKeyDto, userId, role);

      expect(result).toEqual(mockResponse);
      expect(service.updateEnrollmentKey).toHaveBeenCalledWith(courseId, userId, role, updateEnrollmentKeyDto);
    });
  });

  describe('getParticipants', () => {
    it('should return course participants', async () => {
      const courseId = 'course-1';
      const userId = 'user-1';
      const role = Role.DOSEN;

      const mockResponse = {
        success: true,
        data: {
          courseId,
          courseName: 'Course 1',
          totalParticipants: 10,
          participants: [],
        },
        message: 'Participants retrieved successfully',
      };

      mockCoursesService.getParticipants.mockResolvedValue(mockResponse);

      const result = await controller.getParticipants(courseId, userId, role);

      expect(result).toEqual(mockResponse);
      expect(service.getParticipants).toHaveBeenCalledWith(courseId, userId, role);
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant from course', async () => {
      const courseId = 'course-1';
      const participantId = 'enrollment-1';
      const userId = 'user-1';
      const role = Role.ADMIN;

      const mockResponse = {
        success: true,
        data: null,
        message: 'Participant removed successfully',
      };

      mockCoursesService.removeParticipant.mockResolvedValue(mockResponse);

      const result = await controller.removeParticipant(courseId, participantId, userId, role);

      expect(result).toEqual(mockResponse);
      expect(service.removeParticipant).toHaveBeenCalledWith(courseId, participantId, userId, role);
    });
  });
});