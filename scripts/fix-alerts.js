const fs = require('fs');
const path = require('path');

const dirToScan = path.join(__dirname, '../src');

const replacements = [
  { regex: /bg-red-50(?! dark:bg-red-900\/20)/g, replace: 'bg-red-50 dark:bg-red-900/20' },
  { regex: /border-red-200(?! dark:border-red-900\/50)/g, replace: 'border-red-200 dark:border-red-900/50' },
  { regex: /text-red-800(?! dark:text-red-400)/g, replace: 'text-red-800 dark:text-red-400' },
  { regex: /text-red-700(?! dark:text-red-400)/g, replace: 'text-red-700 dark:text-red-400' },
  { regex: /text-red-600(?! dark:text-red-400)/g, replace: 'text-red-600 dark:text-red-400' },
  { regex: /bg-green-50(?! dark:bg-green-900\/20)/g, replace: 'bg-green-50 dark:bg-green-900/20' },
  { regex: /border-green-200(?! dark:border-green-900\/50)/g, replace: 'border-green-200 dark:border-green-900/50' },
  { regex: /text-green-800(?! dark:text-green-400)/g, replace: 'text-green-800 dark:text-green-400' },
  { regex: /text-green-700(?! dark:text-green-400)/g, replace: 'text-green-700 dark:text-green-400' }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const { regex, replace } of replacements) {
    content = content.replace(regex, replace);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Alerts fixed: ${filePath}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

console.log('Fixing alert colors for dark mode...');
traverse(dirToScan);
console.log('Done.');
