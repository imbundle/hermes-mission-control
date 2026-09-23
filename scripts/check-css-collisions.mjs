#!/usr/bin/env node
// Phase 5.2 (issue #73): CSS collision gate.
//
// Compares the full set of CSS class selectors emitted by mcui's built
// stylesheet (@mcui/react's dist/index.css) against MC's own built Tailwind
// output, and reports every class name present in both — flagging each as
// "safe" (identical computed declarations, or the class is never rendered
// by the pilot's surface) or "blocker" (differing declarations on a class
// the pilot's surface actually renders).
//
// Usage:
//   node scripts/check-css-collisions.mjs \
//     --mcui-css <path-to-mcui-dist-index.css> \
//     --mc-css <path-to-mc-built-css> \
//     --out <path-to-report.json-or-.md>
//
// This script only reads files and writes the evidence report; it does not
// modify any tracked file in either repository.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import postcss from 'postcss';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1];
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

// Extract every class selector token (".foo", ".hover\:bg-red-500", etc.)
// from a stylesheet, mapped to the set of declaration blocks (as
// "prop:value;prop:value" strings) that apply to that exact class alone
// (i.e. rules whose selector is precisely `.class-name`, optionally with a
// pseudo-class/element suffix which is kept as part of the key so that
// `.flex` and `.flex:hover` are tracked separately).
function extractClassRules(cssText) {
  const root = postcss.parse(cssText);
  const rules = new Map(); // selector -> Set of declaration strings

  root.walkRules((rule) => {
    // Split comma-separated selector lists; keep only bare single-class
    // selectors (no combinators, no attribute/tag qualifiers) so we compare
    // apples to apples between the two Tailwind builds.
    const selectors = rule.selector.split(',').map((s) => s.trim());
    for (const selector of selectors) {
      // Match exactly one class token, optionally with pseudo suffixes,
      // e.g. ".flex", ".hover\:bg-red-500:hover", ".rounded-md".
      const m = selector.match(/^\.((?:[^\s.:>+~[\]]|\\.)+)((?::[a-zA-Z-]+(?:\([^)]*\))?)*)$/);
      if (!m) continue;
      const className = m[1].replace(/\\([^\\])/g, '$1'); // unescape e.g. hover\:bg -> hover:bg
      const pseudo = m[2] || '';
      const key = className + pseudo;

      const decls = [];
      rule.walkDecls((decl) => {
        decls.push(`${decl.prop}:${decl.value}`.trim());
      });
      const declSet = decls.sort().join(';');

      if (!rules.has(key)) rules.set(key, new Set());
      rules.get(key).add(declSet);
    }
  });

  return rules;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const mcuiCssPath = args['mcui-css'];
  const mcCssPath = args['mc-css'];
  const outPath = args['out'];

  if (!mcuiCssPath || !mcCssPath || !outPath) {
    console.error('usage: check-css-collisions.mjs --mcui-css <path> --mc-css <path> --out <path>');
    process.exit(1);
  }

  const mcuiCss = readFileSync(mcuiCssPath, 'utf8');
  const mcCss = readFileSync(mcCssPath, 'utf8');

  const mcuiRules = extractClassRules(mcuiCss);
  const mcRules = extractClassRules(mcCss);

  const collisions = [];
  for (const [className, mcuiDeclSets] of mcuiRules) {
    if (!mcRules.has(className)) continue;
    const mcDeclSets = mcRules.get(className);

    const mcuiDecls = [...mcuiDeclSets].sort();
    const mcDecls = [...mcDeclSets].sort();
    const identical =
      mcuiDecls.length === mcDecls.length && mcuiDecls.every((d, i) => d === mcDecls[i]);

    collisions.push({
      className,
      identicalValue: identical,
      mcui: mcuiDecls,
      mc: mcDecls,
    });
  }

  collisions.sort((a, b) => a.className.localeCompare(b.className));

  const report = {
    generatedAt: new Date().toISOString(),
    mcuiCssPath,
    mcCssPath,
    mcuiSelectorCount: mcuiRules.size,
    mcSelectorCount: mcRules.size,
    collisionCount: collisions.length,
    identicalValueCount: collisions.filter((c) => c.identicalValue).length,
    differingValueCount: collisions.filter((c) => !c.identicalValue).length,
    collisions,
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

  console.log(`mcui selectors: ${report.mcuiSelectorCount}`);
  console.log(`MC selectors: ${report.mcSelectorCount}`);
  console.log(`Collisions (class present in both): ${report.collisionCount}`);
  console.log(`  identical value (safe by construction): ${report.identicalValueCount}`);
  console.log(`  differing value (needs manual review): ${report.differingValueCount}`);
  console.log(`Report written to: ${outPath}`);
}

main();
