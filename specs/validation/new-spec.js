#!/usr/bin/env node

/**
 * New Spec Generator
 * 
 * Interactive CLI to create new specification files from the template.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n📝 New Specification Generator\n');
  console.log('This will help you create a new spec from the template.\n');

  // Get spec type
  console.log('Select specification type:');
  console.log('  1. Feature (user-facing functionality)');
  console.log('  2. API (endpoint or service)');
  console.log('  3. Component (UI component)');
  console.log('  4. Database (schema or data model)');
  console.log('  5. Other\n');
  
  const typeChoice = await question('Enter choice (1-5): ');
  
  const typeMap = {
    '1': { dir: 'features', label: 'Feature' },
    '2': { dir: 'api', label: 'API' },
    '3': { dir: 'components', label: 'Component' },
    '4': { dir: 'database', label: 'Database' },
    '5': { dir: '', label: 'Other' }
  };
  
  const type = typeMap[typeChoice] || typeMap['5'];
  
  // Get spec name
  const name = await question('\nEnter spec name (kebab-case, e.g., "chat-threading"): ');
  const fileName = name.trim().toLowerCase().replace(/\s+/g, '-') + '.md';
  
  // Get author
  const author = await question('Enter your name: ');
  
  // Get initial description
  const description = await question('Brief description (one line): ');
  
  // Determine file path
  const baseDir = path.join(__dirname, '..');
  const targetDir = type.dir ? path.join(baseDir, type.dir) : baseDir;
  const filePath = path.join(targetDir, fileName);
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.log(`\n❌ Error: File already exists at ${filePath}`);
    rl.close();
    process.exit(1);
  }
  
  // Read template
  const templatePath = path.join(baseDir, 'TEMPLATE.md');
  let content = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholders
  const today = new Date().toISOString().split('T')[0];
  content = content.replace('# [DRAFT] Feature/Component Name', `# [DRAFT] ${name}`);
  content = content.replace('**Author:** Your Name', `**Author:** ${author}`);
  content = content.replace(/\*\*Created:\*\* YYYY-MM-DD/g, `**Created:** ${today}`);
  content = content.replace(/\*\*Last Updated:\*\* YYYY-MM-DD/g, `**Last Updated:** ${today}`);
  content = content.replace(
    'Brief description of what this specification covers. Explain the problem being solved or the feature being added.',
    description
  );
  
  // Write file
  fs.writeFileSync(filePath, content);
  
  console.log(`\n✅ Created new specification at:`);
  console.log(`   ${filePath}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Open the file and fill in the remaining sections`);
  console.log(`  2. Run "pnpm validate-specs ${filePath}" to validate`);
  console.log(`  3. Move status to [REVIEW] when ready for feedback\n`);
  
  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});
