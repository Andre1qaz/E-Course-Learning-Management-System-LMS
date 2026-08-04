import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubric.dto';
import { SubmitRubricAssessmentDto } from './dto/submit-rubric-assessment.dto';
import { Role } from '@prisma/client';

// Heuristic #16: Instructional Assessment — structured rubric management
// Heuristic #5: Error Prevention — validate permissions and data consistency

@Injectable()
export class RubricsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new rubric for an assignment
   */
  async create(assignmentId: string, userId: string, userRole: Role, dto: CreateRubricDto) {
    // Check assignment access
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && assignment.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can create rubrics');
    }

    // Check if rubric already exists
    const existingRubric = await this.prisma.rubric.findUnique({
      where: { assignmentId },
    });

    if (existingRubric) {
      throw new ForbiddenException('A rubric already exists for this assignment');
    }

    // Validate total points matches assignment maxScore
    if (dto.totalPoints !== assignment.maxScore) {
      throw new ForbiddenException(`Rubric total points must match assignment maxScore (${assignment.maxScore})`);
    }

    // Create rubric with criteria and levels
    const rubric = await this.prisma.rubric.create({
      data: {
        assignmentId,
        name: dto.name,
        description: dto.description,
        totalPoints: dto.totalPoints,
        criteria: {
          create: dto.criteria.map((criterion) => ({
            name: criterion.name,
            description: criterion.description,
            maxPoints: criterion.maxPoints,
            order: criterion.order,
            levels: {
              create: criterion.levels.map((level) => ({
                name: level.name,
                description: level.description,
                points: level.points,
                order: level.order,
              })),
            },
          })),
        },
      },
      include: {
        criteria: {
          include: {
            levels: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return {
      success: true,
      data: rubric,
      message: 'Rubric created successfully',
    };
  }

  /**
   * Get rubric by assignment ID
   */
  async findByAssignment(assignmentId: string, userId: string, userRole: Role) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check access permissions
    const hasAccess =
      userRole === Role.ADMIN ||
      assignment.course.instructorId === userId ||
      (await this.prisma.enrollment.findFirst({
        where: { courseId: assignment.courseId, userId },
      }));

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this assignment');
    }

    const rubric = await this.prisma.rubric.findUnique({
      where: { assignmentId },
      include: {
        criteria: {
          include: {
            levels: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!rubric) {
      return {
        success: true,
        data: null,
        message: 'No rubric exists for this assignment',
      };
    }

    return {
      success: true,
      data: rubric,
      message: 'Rubric retrieved successfully',
    };
  }

  /**
   * Update rubric
   */
  async update(id: string, userId: string, userRole: Role, dto: UpdateRubricDto) {
    const rubric = await this.prisma.rubric.findUnique({
      where: { id },
      include: { assignment: { include: { course: true } } },
    });

    if (!rubric) {
      throw new NotFoundException('Rubric not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && rubric.assignment.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can update this rubric');
    }

    // Validate total points if provided
    if (dto.totalPoints !== undefined && dto.totalPoints !== rubric.assignment.maxScore) {
      throw new ForbiddenException(`Rubric total points must match assignment maxScore (${rubric.assignment.maxScore})`);
    }

    const updatedRubric = await this.prisma.rubric.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.totalPoints !== undefined && { totalPoints: dto.totalPoints }),
      },
      include: {
        criteria: {
          include: {
            levels: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return {
      success: true,
      data: updatedRubric,
      message: 'Rubric updated successfully',
    };
  }

  /**
   * Delete rubric
   */
  async remove(id: string, userId: string, userRole: Role) {
    const rubric = await this.prisma.rubric.findUnique({
      where: { id },
      include: { assignment: { include: { course: true } } },
    });

    if (!rubric) {
      throw new NotFoundException('Rubric not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && rubric.assignment.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can delete this rubric');
    }

    await this.prisma.rubric.delete({
      where: { id },
    });

    return {
      success: true,
      data: null,
      message: 'Rubric deleted successfully',
    };
  }

  /**
   * Submit rubric assessment for a submission
   */
  async submitAssessment(
    submissionId: string,
    userId: string,
    userRole: Role,
    dto: SubmitRubricAssessmentDto,
  ) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            course: true,
            rubric: {
              include: {
                criteria: {
                  include: {
                    levels: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && submission.assignment.course.instructorId !== userId) {
      throw new ForbiddenException('Only Admin and course instructor can grade submissions');
    }

    if (!submission.assignment.rubric) {
      throw new ForbiddenException('No rubric exists for this assignment');
    }

    // Delete existing assessments for this submission
    await this.prisma.rubricAssessment.deleteMany({
      where: { submissionId },
    });

    // Create new assessments
    const assessments = await this.prisma.rubricAssessment.createMany({
      data: dto.assessments.map((assessment) => ({
        submissionId,
        rubricCriterionId: assessment.rubricCriterionId,
        rubricCriterionLevelId: assessment.rubricCriterionLevelId,
        score: assessment.score,
        feedback: assessment.feedback,
      })),
    });

    // Calculate total score from rubric assessments
    const totalScore = dto.assessments.reduce((sum, a) => sum + a.score, 0);

    // Update submission with total score
    await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: totalScore,
        status: 'GRADED',
      },
    });

    return {
      success: true,
      data: { totalScore, assessmentsCount: assessments.count },
      message: 'Rubric assessment submitted successfully',
    };
  }

  /**
   * Get rubric assessment for a submission
   */
  async getAssessment(submissionId: string, userId: string, userRole: Role) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Check access permissions
    const hasAccess =
      userRole === Role.ADMIN ||
      submission.assignment.course.instructorId === userId ||
      submission.studentId === userId;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this submission');
    }

    const assessments = await this.prisma.rubricAssessment.findMany({
      where: { submissionId },
      include: {
        criterion: {
          include: {
            levels: true,
          },
        },
        level: true,
      },
      orderBy: {
        criterion: {
          order: 'asc',
        },
      },
    });

    return {
      success: true,
      data: assessments,
      message: 'Rubric assessment retrieved successfully',
    };
  }
}
