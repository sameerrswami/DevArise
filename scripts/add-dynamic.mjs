import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

function getAllRouteFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllRouteFiles(fullPath));
    } else if (entry === 'route.js') {
      files.push(fullPath);
    }
  }
  return files;
}

const apiDir = join(process.cwd(), 'app', 'api');
const routeFiles = getAllRouteFiles(apiDir);

let fixed = 0;
for (const file of routeFiles) {
  const content = readFileSync(file, 'utf8');
  if (!content.includes('export const dynamic')) {
    // Insert after the last import line
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) lastImportIdx = i;
    }
    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, '\nexport const dynamic = "force-dynamic";');
      writeFileSync(file, lines.join('\n'), 'utf8');
      fixed++;
      console.log('Fixed:', file);
    }
  }
}
console.log(`\nTotal fixed: ${fixed} files`);
