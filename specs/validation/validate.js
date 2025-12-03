#!/usr/bin/env node

/**
 * Specification Validation Script
 * 
 * Validates that spec files follow the required format and contain
 * all necessary sections for spec-driven development.
 */

const fs = require('fs');
const path = require('path');

// Required sections in every spec
const REQUIRED_SECTIONS = [
  'Overview',
  'Goals',
  'Requirements',
  'Technical Design',
  'Testing Strategy'
];

// Valid status labels
const VALID_STATUSES = ['DRAFT', 'REVIEW', 'APPROVED', 'IMPLEMENTED', 'DEPRECATED'];

/**
 * Validate a single spec file
 */
function validateSpec(filePath) {
  console.log(`\nValidating: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let isValid = true;
  const issues = [];

  // Check 1: Status label
  const hasStatus = VALID_STATUSES.some(status => 
    content.includes(`[${status}]`)
  );
  if (!hasStatus) {
    issues.push(`Missing or invalid status label. Use one of: ${VALID_STATUSES.map(s => `[${s}]`).join(', ')}`);
    isValid = false;
  }

  // Check 2: Required sections
  REQUIRED_SECTIONS.forEach(section => {
    const hasSection = content.includes(`## ${section}`);
    if (!hasSection) {
      issues.push(`Missing required section: ## ${section}`);
      isValid = false;
    }
  });

  // Check 3: Metadata (Author and dates)
  if (!content.includes('**Author:**')) {
    issues.push('Missing **Author:** metadata');
    isValid = false;
  }
  if (!content.includes('**Created:**')) {
    issues.push('Missing **Created:** date');
    isValid = false;
  }
  if (!content.includes('**Last Updated:**')) {
    issues.push('Missing **Last Updated:** date');
    isValid = false;
  }

  // Check 4: At least some checkboxes in requirements
  const hasCheckboxes = content.includes('- [ ]') || content.includes('- [x]');
  if (!hasCheckboxes) {
    issues.push('No requirement checkboxes found. Use "- [ ]" for requirements');
    isValid = false;
  }

  // Print results
  if (isValid) {
    console.log('✅ Spec is valid!');
  } else {
    console.log('❌ Spec validation failed:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  return isValid;
}

/**
 * Find all spec files in a directory
 */
function findSpecFiles(dir) {
  const files = [];
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'validation') {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md') && 
                 entry.name !== 'README.md' && entry.name !== 'TEMPLATE.md') {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Validate specific file
    const filePath = path.resolve(args[0]);
    const isValid = validateSpec(filePath);
    process.exit(isValid ? 0 : 1);
  } else {
    // Validate all specs
    const specsDir = path.join(__dirname, '..');
    const specFiles = findSpecFiles(specsDir);
    
    if (specFiles.length === 0) {
      console.log('No specification files found to validate.');
      console.log('Create specs using the TEMPLATE.md as a starting point.');
      process.exit(0);
    }
    
    console.log(`Found ${specFiles.length} specification file(s) to validate:\n`);
    
    let allValid = true;
    specFiles.forEach(file => {
      const isValid = validateSpec(file);
      if (!isValid) allValid = false;
    });
    
    console.log('\n' + '='.repeat(50));
    if (allValid) {
      console.log('✅ All specifications are valid!');
      process.exit(0);
    } else {
      console.log('❌ Some specifications have issues. Please fix them.');
      process.exit(1);
    }
  }
}

main();
