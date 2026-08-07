#!/usr/bin/env ts-node

/**
 * CLI Script untuk generate resource baru secara otomatis
 * 
 * Penggunaan:
 * ts-node scripts/generate-resource.ts --name=ResourceName --fields="field1:string,field2:number:required"
 * 
 * Contoh:
 * ts-node scripts/generate-resource.ts --name=Announcement --fields="title:string:required,content:text:required,courseId:string"
 */

import { ResourceGenerator } from '../src/common/cli/generate-resource';

interface Args {
  name: string;
  fields?: string;
  hasCourse?: boolean;
  hasUser?: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = {
    name: '',
    fields: '',
    hasCourse: false,
    hasUser: false,
  };

  args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key === '--name') result.name = value;
    if (key === '--fields') result.fields = value;
    if (key === '--hasCourse') result.hasCourse = value === 'true';
    if (key === '--hasUser') result.hasUser = value === 'true';
  });

  return result;
}

function validateArgs(args: Args): void {
  if (!args.name) {
    console.error('Error: --name is required');
    console.error('Usage: ts-node scripts/generate-resource.ts --name=ResourceName --fields="field1:type,field2:type"');
    process.exit(1);
  }

  if (!args.fields) {
    console.warn('Warning: --fields not provided. You will need to add fields manually.');
  }
}

async function main() {
  console.log('🚀 E-Course Resource Generator');
  console.log('==============================\n');

  const args = parseArgs();
  validateArgs(args);

  const generator = new ResourceGenerator();

  // Build config
  const config = {
    name: args.name,
    namePlural: '', // Will be calculated by generator
    nameCamel: '', // Will be calculated by generator
    nameKebab: '', // Will be calculated by generator
    fields: args.fields ? generator.parseFields(args.fields) : [],
    hasCourseRelation: args.hasCourse,
    hasUserRelation: args.hasUser,
  };

  try {
    await generator.generate(config);
    console.log('\n✅ Resource generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update prisma/schema.prisma with the new model');
    console.log('2. Run: npx prisma generate');
    console.log('3. Run: npx prisma migrate dev --name add_' + config.name.toLowerCase());
    console.log('4. Import the module in app.module.ts');
    console.log('5. Test the endpoints');
  } catch (error) {
    console.error('❌ Error generating resource:', error);
    process.exit(1);
  }
}

main();
