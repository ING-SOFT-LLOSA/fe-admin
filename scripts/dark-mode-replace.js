const fs = require('fs');
const path = require('path');

const dirToScan = path.join(__dirname, '../src');

// Maps standard tailwind slate/dark classes to the new Llosa Corporate Dark Theme
const replacements = [
  // Backgrounds (slate -> white alpha)
  { regex: /dark:bg-slate-900\/95/g, replace: 'dark:bg-[#231f20]/95' },
  { regex: /dark:bg-slate-900/g, replace: 'dark:bg-[#231f20]' },
  { regex: /dark:bg-slate-800\/50/g, replace: 'dark:bg-white/5' },
  { regex: /dark:bg-slate-800/g, replace: 'dark:bg-white/10' },
  { regex: /dark:bg-slate-700/g, replace: 'dark:bg-white/15' },
  { regex: /dark:bg-slate-50/g, replace: 'dark:bg-white/5' },
  { regex: /dark:hover:bg-slate-800\/70/g, replace: 'dark:hover:bg-white/10' },
  { regex: /dark:hover:bg-slate-800\/50/g, replace: 'dark:hover:bg-white/5' },
  { regex: /dark:hover:bg-slate-800/g, replace: 'dark:hover:bg-white/10' },

  // Borders
  { regex: /dark:border-slate-800/g, replace: 'dark:border-white/5' },
  { regex: /dark:border-slate-700\/80/g, replace: 'dark:border-white/10' },
  { regex: /dark:border-slate-700\/60/g, replace: 'dark:border-white/10' },
  { regex: /dark:border-slate-700\/50/g, replace: 'dark:border-white/10' },
  { regex: /dark:border-slate-700/g, replace: 'dark:border-white/10' },
  { regex: /dark:border-slate-600/g, replace: 'dark:border-white/20' },
  { regex: /dark:divide-slate-800/g, replace: 'dark:divide-white/5' },
  { regex: /dark:divide-slate-700\/60/g, replace: 'dark:divide-white/10' },

  // Text
  { regex: /dark:text-slate-100/g, replace: 'dark:text-white/90' },
  { regex: /dark:text-slate-200/g, replace: 'dark:text-white/80' },
  { regex: /dark:text-slate-300/g, replace: 'dark:text-white/70' },
  { regex: /dark:text-slate-400/g, replace: 'dark:text-white/60' },
  { regex: /dark:text-slate-500/g, replace: 'dark:text-white/50' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const { regex, replace } of replacements) {
    content = content.replace(regex, replace);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Corporate Refined: ${filePath}`);
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

console.log('Starting corporate dark mode replacement...');
traverse(dirToScan);
console.log('Done.');
