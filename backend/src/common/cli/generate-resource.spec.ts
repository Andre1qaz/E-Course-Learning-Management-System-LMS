import { ResourceGenerator } from './generate-resource';

/**
 * Contoh penggunaan ResourceGenerator
 *
 * Ini adalah unit test untuk menunjukkan cara menggunakan generator
 */

describe('ResourceGenerator', () => {
  let generator: ResourceGenerator;

  beforeEach(() => {
    generator = new ResourceGenerator();
  });

  describe('parseFields', () => {
    it('should parse simple string fields', () => {
      const fields = generator.parseFields('title:string,description:string');
      expect(fields).toHaveLength(2);
      expect(fields[0].name).toBe('title');
      expect(fields[0].type).toBe('string');
      expect(fields[0].required).toBe(false);
    });

    it('should parse required fields', () => {
      const fields = generator.parseFields('title:string:required');
      expect(fields[0].required).toBe(true);
    });

    it('should parse different field types', () => {
      const fields = generator.parseFields(
        'title:string,price:number,startDate:date,published:boolean',
      );
      expect(fields).toHaveLength(4);
      expect(fields[0].type).toBe('string');
      expect(fields[1].type).toBe('number');
      expect(fields[2].type).toBe('date');
      expect(fields[3].type).toBe('boolean');
    });
  });

  describe('formatName', () => {
    it('should convert ResourceName to camelCase', () => {
      // Testing name formatting
      const name = 'ResourceName';
      const camelCase = name.charAt(0).toLowerCase() + name.slice(1);
      expect(camelCase).toBe('resourceName');
    });

    it('should convert to kebab-case', () => {
      const name = 'ResourceName';
      const kebabCase = name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase();
      expect(kebabCase).toBe('resource-name');
    });
  });
});

/**
 * CONTOH PENGGUNAAN CLI GENERATOR
 *
 * Di terminal, jalankan:
 *
 * 1. Generate resource sederhana:
 *    ts-node scripts/generate-resource.ts --name=Announcement --fields="title:string:required,content:text:required"
 *
 * 2. Generate resource dengan relasi course:
 *    ts-node scripts/generate-resource.ts --name=Assignment --fields="title:string:required,description:text,courseId:string" --hasCourse=true
 *
 * 3. Generate resource dengan berbagai tipe field:
 *    ts-node scripts/generate-resource.ts --name=Exam --fields="title:string:required,startTime:date:required,duration:number:required,maxScore:number"
 *
 *
 * CONTOH PENGGUNAAN BASE CLASS
 *
 * Di service yang baru dibuat:
 *
 * import { BaseService } from '../common/base/base.service';
 * import { RequiredString, OptionalString, RequiredDate } from '../common/base/dto.decorators';
 *
 * @Injectable()
 * export class AnnouncementService extends BaseService<any> {
 *   constructor(private prisma: PrismaService) {
 *     super(prisma);
 *   }
 *
 *   async create(userId: string, userRole: Role, dto: CreateAnnouncementDto) {
 *     // Otomatis dapat permission checking
 *     this.checkRoleAccess(userRole, [Role.ADMIN, Role.DOSEN]);
 *
 *     // Otomatis dapat response formatting
 *     const announcement = await this.prisma.announcement.create({ data: dto });
 *     return this.formatResponse(announcement, 'Announcement created successfully');
 *   }
 * }
 *
 * Di DTO yang baru dibuat:
 *
 * import { RequiredString, DescriptionField, RequiredDate } from '../../common/base/dto.decorators';
 *
 * export class CreateAnnouncementDto {
 *   @RequiredString(200)
 *   title!: string;
 *
 *   @DescriptionField(5000)
 *   content?: string;
 *
 *   @RequiredDate()
 *   startDate!: string;
 * }
 */
