#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {
        name: '',
        fields: '',
        hasCourse: false,
        hasUser: false,
    };
    args.forEach(arg => {
        const [key, value] = arg.split('=');
        if (key === '--name')
            result.name = value;
        if (key === '--fields')
            result.fields = value;
        if (key === '--hasCourse')
            result.hasCourse = value === 'true';
        if (key === '--hasUser')
            result.hasUser = value === 'true';
    });
    return result;
}
function validateArgs(args) {
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
    console.log('⚠️  Resource generator is temporarily disabled.');
    console.log('Please create resources manually or enable the generator by uncommenting the import.');
    process.exit(0);
}
main();
//# sourceMappingURL=generate-resource.js.map