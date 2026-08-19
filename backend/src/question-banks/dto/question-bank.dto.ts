import { DifficultyLevel, QuestionType } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { IsOptionalUUID } from '../../common/validators/is-optional-uuid.decorator';

export class CreateQuestionBankDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  topic?: string;

  @IsOptional()
  @IsOptionalUUID()
  courseId?: string;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel;

  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;
}

export class UpdateQuestionBankDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  topic?: string;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel;

  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;
}

export interface AddQuestionDto {
  type: QuestionType;
  questionText: string;
  points: number;
  explanation?: string;
  options?: Array<{
    text: string;
    isCorrect: boolean;
  }>;
}

export interface QuestionBankWithQuestions {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  difficulty: DifficultyLevel;
  questionType: QuestionType | null;
  course: {
    id: string;
    name: string;
    code: string;
    instructorId: string;
  } | null;
  questions: Array<{
    id: string;
    type: QuestionType;
    questionText: string;
    points: number;
    explanation: string | null;
    options: Array<{
      id: string;
      optionText: string;
      isCorrect: boolean;
      order: number;
    }>;
  }>;
}

export interface ImportQuestionBankDto {
  format: 'json' | 'csv' | 'excel' | 'xlsx';
  data: any;
  courseId?: string;
}

export interface JsonQuestionBankImport {
  metadata: {
    title: string;
    description?: string;
    topic?: string;
    difficulty?: DifficultyLevel;
    questionType?: QuestionType;
  };
  questions: Array<{
    type: QuestionType;
    questionText: string;
    points: number;
    explanation?: string;
    options?: Array<{
      optionText: string;
      isCorrect: boolean;
    }>;
  }>;
}

export interface CsvQuestionImport {
  type?: string;
  questionText: string;
  points: string;
  explanation?: string;
  options?: string;
  correctAnswer?: string;
}

export interface ExcelQuestionImport {
  type?: string;
  questionText: string;
  points: string;
  explanation?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  correctAnswer?: string;
}
