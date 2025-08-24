/**
 * Script to update GitHub links in project files
 * Usage: node update-github-links.js YOUR-USERNAME
 */

import fs from 'fs';
import path from 'path';

const username = process.argv[2];

if (!username) {
    console.log('❌ Please provide your GitHub username:');
    console.log('   node update-github-links.js YOUR-USERNAME');
    console.log('');
    console.log('Example:');
    console.log('   node update-github-links.js johnsmith');
    process.exit(1);
}

console.log(`🔗 Updating GitHub links for username: ${username}`);

// Files to update
const filesToUpdate = [
    'package.json',
    'README.md'
];

// Update package.json
try {
    const packagePath = 'package.json';
    let packageContent = fs.readFileSync(packagePath, 'utf8');
    
    packageContent = packageContent.replace(
        /your-username/g, 
        username
    );
    
    fs.writeFileSync(packagePath, packageContent);
    console.log('✅ Updated package.json');
} catch (error) {
    console.log('❌ Error updating package.json:', error.message);
}

// Update README.md - remove placeholder image reference since we don't have it yet
try {
    const readmePath = 'README.md';
    let readmeContent = fs.readFileSync(readmePath, 'utf8');
    
    // Remove the placeholder image line
    readmeContent = readmeContent.replace(
        /!\[Consciousness World\]\(docs\/images\/simulation-screenshot\.png\)\n\n/g,
        ''
    );
    
    // Update any other placeholder references if needed
    readmeContent = readmeContent.replace(
        /your-username/g, 
        username
    );
    
    fs.writeFileSync(readmePath, readmeContent);
    console.log('✅ Updated README.md');
} catch (error) {
    console.log('❌ Error updating README.md:', error.message);
}

console.log('');
console.log('🎉 GitHub links updated successfully!');
console.log('');
console.log('Next steps:');
console.log('1. Initialize git: git init');
console.log('2. Add files: git add .');
console.log('3. Commit: git commit -m "Initial consciousness world simulation"');
console.log(`4. Add remote: git remote add origin https://github.com/${username}/consciousness-world.git`);
console.log('5. Push: git push -u origin main');
console.log('');
console.log('💡 Don\'t forget to delete this script after running it:');
console.log('   rm update-github-links.js');