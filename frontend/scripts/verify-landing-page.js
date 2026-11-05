const fs = require('fs');
const path = require('path');

const pagePath = path.resolve(__dirname, '../src/app/[locale]/page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');

console.log('=== EMPIRICAL VERIFICATION REPORT FOR LANDING PAGE ===\n');

// 1. EXTRACT ALL HREFS AND IDS
const hrefRegex = /href\s*=\s*(["'][^"']+["']|\{[^}]+\})/g;
const hrefs = [];
let match;
while ((match = hrefRegex.exec(pageContent)) !== null) {
  const line = pageContent.substring(0, match.index).split('\n').length;
  const raw = match[1];
  const clean = raw.replace(/^["']|["']$/g, '');
  hrefs.push({ line, raw, clean });
}

console.log(`[1] Total href links found: ${hrefs.length}`);
hrefs.forEach(h => {
  console.log(`  Line ${String(h.line).padStart(4, ' ')}: href=${h.raw}`);
});

// 2. CHECK DEAD LINKS (# alone, javascript:void(0), missing paths)
console.log('\n[2] Checking for dead/broken link patterns:');
let deadLinkCount = 0;
hrefs.forEach(h => {
  if (h.clean === '#' || h.clean === '#!') {
    console.error(`  FAIL: Dead anchor found at line ${h.line}: href="${h.clean}"`);
    deadLinkCount++;
  } else if (h.clean.startsWith('javascript:')) {
    console.error(`  FAIL: Javascript void link found at line ${h.line}: href="${h.clean}"`);
    deadLinkCount++;
  } else if (h.clean.trim() === '') {
    console.error(`  FAIL: Empty href at line ${h.line}`);
    deadLinkCount++;
  }
});

if (deadLinkCount === 0) {
  console.log('  PASS: Zero dead links (# alone, javascript:void, empty href) detected.');
}

// 3. CHECK HASH ANCHOR TARGETS
const idRegex = /id\s*=\s*["']([^"']+)["']/g;
const ids = new Map();
while ((match = idRegex.exec(pageContent)) !== null) {
  const line = pageContent.substring(0, match.index).split('\n').length;
  ids.set(match[1], line);
}

console.log(`\n[3] DOM IDs declared in page:`);
for (const [id, line] of ids.entries()) {
  console.log(`  Line ${String(line).padStart(4, ' ')}: id="${id}"`);
}

console.log('\n[4] Verifying all #hash links match declared DOM IDs:');
let hashErrors = 0;
hrefs.filter(h => h.clean.startsWith('#')).forEach(h => {
  const targetId = h.clean.substring(1);
  if (!ids.has(targetId)) {
    console.error(`  FAIL: Hash link "${h.clean}" at line ${h.line} has no matching id="${targetId}" in the document!`);
    hashErrors++;
  } else {
    console.log(`  PASS: Hash link "${h.clean}" at line ${h.line} -> matches id="${targetId}" declared at line ${ids.get(targetId)}`);
  }
});

// 5. CHECK ROUTE TARGETS AGAINST APP ROUTER FILESYSTEM
console.log('\n[5] Verifying route targets in Next.js filesystem:');
const routeMap = {
  '/': path.resolve(__dirname, '../src/app/[locale]/page.tsx'),
  '/signup': path.resolve(__dirname, '../src/app/[locale]/(auth)/signup/page.tsx'),
  '/login': path.resolve(__dirname, '../src/app/[locale]/(auth)/login/page.tsx'),
  '/intake': path.resolve(__dirname, '../src/app/[locale]/(apps)/intake/page.tsx'),
  '/intake/chat': path.resolve(__dirname, '../src/app/[locale]/(apps)/intake/chat/page.tsx'),
  '/intake/voice': path.resolve(__dirname, '../src/app/[locale]/(apps)/intake/voice/page.tsx'),
  '/mindspace': path.resolve(__dirname, '../src/app/[locale]/(apps)/mindspace/page.tsx'),
};

let routeErrors = 0;
const appRoutes = hrefs.filter(h => !h.clean.startsWith('#') && !h.clean.startsWith('http'));
const uniqueRoutes = [...new Set(appRoutes.map(h => h.clean))];

uniqueRoutes.forEach(r => {
  const targetFile = routeMap[r];
  if (!targetFile) {
    console.error(`  FAIL: Route "${r}" is not registered in expected route map!`);
    routeErrors++;
  } else if (!fs.existsSync(targetFile)) {
    console.error(`  FAIL: Route "${r}" points to non-existent file: ${targetFile}`);
    routeErrors++;
  } else {
    console.log(`  PASS: Route "${r}" exists at ${path.relative(__dirname + '/..', targetFile)}`);
  }
});

// 6. CHECK ALL IMPORTED MODULES
console.log('\n[6] Verifying all component imports:');
const importRegex = /import\s+(?:(?:\*\s+as\s+\w+)|(?:\{[^}]+\})|(?:[A-Za-z0-9_]+))\s+from\s+["']([^"']+)["']/g;
const imports = [];
while ((match = importRegex.exec(pageContent)) !== null) {
  const line = pageContent.substring(0, match.index).split('\n').length;
  imports.push({ line, statement: match[0], specifier: match[1] });
}

let importErrors = 0;
imports.forEach(imp => {
  const spec = imp.specifier;
  if (spec.startsWith('@/')) {
    const relPath = spec.replace('@/', 'src/');
    const resolvedTsx = path.resolve(__dirname, '..', relPath + '.tsx');
    const resolvedTs = path.resolve(__dirname, '..', relPath + '.ts');
    const resolvedDir = path.resolve(__dirname, '..', relPath, 'index.ts');
    const resolvedDirTsx = path.resolve(__dirname, '..', relPath, 'index.tsx');

    if (fs.existsSync(resolvedTsx)) {
      console.log(`  PASS: Local import "${spec}" -> ${path.relative(__dirname + '/..', resolvedTsx)}`);
    } else if (fs.existsSync(resolvedTs)) {
      console.log(`  PASS: Local import "${spec}" -> ${path.relative(__dirname + '/..', resolvedTs)}`);
    } else if (fs.existsSync(resolvedDir)) {
      console.log(`  PASS: Local import "${spec}" -> ${path.relative(__dirname + '/..', resolvedDir)}`);
    } else if (fs.existsSync(resolvedDirTsx)) {
      console.log(`  PASS: Local import "${spec}" -> ${path.relative(__dirname + '/..', resolvedDirTsx)}`);
    } else {
      console.error(`  FAIL: Local import "${spec}" does not resolve to any file on disk!`);
      importErrors++;
    }
  } else {
    console.log(`  PASS: Package import "${spec}" (managed by node_modules)`);
  }
});

// 7. CLIENT / SERVER DIRECTIVE CHECKS
console.log('\n[7] Checking Server/Client component boundaries:');
const hasUseClient = pageContent.includes('"use client"') || pageContent.includes("'use client'");
console.log(`  page.tsx is a Server Component: ${!hasUseClient}`);

// Check if any client hooks are accidentally used in page.tsx
const clientHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext'];
let hookErrors = 0;
clientHooks.forEach(hook => {
  const regex = new RegExp(`\\b${hook}\\b`);
  if (regex.test(pageContent)) {
    console.error(`  FAIL: Client hook "${hook}" used in Server Component page.tsx without 'use client' directive!`);
    hookErrors++;
  }
});
if (hookErrors === 0) {
  console.log('  PASS: No client hooks (useState, useEffect, etc.) used directly in Server Component page.tsx');
}

// Check that imported interactive components (ThemeSwitcher, LocaleSwitcher) have 'use client'
const clientComponentsToCheck = [
  { name: 'ThemeSwitcher', path: path.resolve(__dirname, '../src/theme/ThemeSwitcher.tsx') },
  { name: 'LocaleSwitcher', path: path.resolve(__dirname, '../src/modules/client/shared/components/LocaleSwitcher.tsx') },
  { name: 'AppLogo', path: path.resolve(__dirname, '../src/modules/client/shared/components/AppLogo.tsx') }
];

clientComponentsToCheck.forEach(comp => {
  if (fs.existsSync(comp.path)) {
    const compContent = fs.readFileSync(comp.path, 'utf8');
    const isClient = compContent.includes('"use client"') || compContent.includes("'use client'");
    const usesHooks = clientHooks.some(hook => new RegExp(`\\b${hook}\\b`).test(compContent));
    if (usesHooks && !isClient) {
      console.error(`  FAIL: Component ${comp.name} uses React hooks but is missing 'use client' directive!`);
      hookErrors++;
    } else {
      console.log(`  PASS: ${comp.name} boundary valid (isClient=${isClient}, usesHooks=${usesHooks})`);
    }
  }
});

// Summary
console.log('\n=== EMPIRICAL SUMMARY ===');
console.log(`Dead Links: ${deadLinkCount}`);
console.log(`Hash Anchor Errors: ${hashErrors}`);
console.log(`Route Path Errors: ${routeErrors}`);
console.log(`Import Errors: ${importErrors}`);
console.log(`Client/Server Boundary Errors: ${hookErrors}`);

const totalErrors = deadLinkCount + hashErrors + routeErrors + importErrors + hookErrors;
if (totalErrors === 0) {
  console.log('\nVERDICT: ALL CHECKS PASSED EMPIRICALLY (0 ERRORS)');
  process.exit(0);
} else {
  console.error(`\nVERDICT: ${totalErrors} ERRORS FOUND`);
  process.exit(1);
}
