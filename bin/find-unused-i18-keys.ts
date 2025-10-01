#!/usr/bin/env tsx
// @ts-nocheck
// -----------------------------------------------------------------------------
// This file was generated with the help of AI (ChatGPT).
// Purpose: find unused i18n keys in a TypeScript/React project.
// -----------------------------------------------------------------------------

import fg from 'fast-glob';
import * as fs from 'fs/promises';
import * as path from 'path';
import ts from 'typescript';

// ----------- CLI args -----------
const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
        const [k, v] = a.split('=');
        return [k.replace(/^--/, ''), v ?? 'true'];
    })
);

const i18Path = args.i18 ?? 'frontend/src/i18.ts';
const srcDir = args.src ?? 'frontend/src';
const varName = args.var ?? 'rawI18'; // override with --var=translations

// ----------- helpers -----------
function escapeForRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isPlainObjectLiteral(node: ts.Node): node is ts.ObjectLiteralExpression {
    return ts.isObjectLiteralExpression(node);
}

// Recursively flatten ObjectLiteral into "a.b.c" keys
function flattenObjectLiteral(node: ts.ObjectLiteralExpression, prefix = ''): string[] {
    const keys: string[] = [];

    for (const prop of node.properties) {
        if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop) && !ts.isMethodDeclaration(prop)) {
            continue; // skip spread, computed, getters, setters
        }

        let name: string | null = null;
        if (prop.name) {
            if (ts.isIdentifier(prop.name)) name = prop.name.text;
            else if (ts.isStringLiteralLike(prop.name)) name = prop.name.text;
            else if (ts.isNumericLiteral(prop.name)) name = prop.name.text;
            else continue;
        } else if (ts.isShorthandPropertyAssignment(prop)) {
            name = prop.name.text;
        }

        if (!name) continue;
        const full = prefix ? `${prefix}.${name}` : name;

        let valueNode: ts.Expression | undefined;
        if (ts.isPropertyAssignment(prop)) valueNode = prop.initializer;

        if (valueNode && isPlainObjectLiteral(valueNode)) {
            keys.push(...flattenObjectLiteral(valueNode, full));
        } else {
            keys.push(full); // leaf key
        }
    }

    return keys;
}

// Find `const varName = { ... }` and extract keys
function extractKeysFromFile(sourceText: string, fileName: string, targetVar: string): string[] {
    const sf = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    let keys: string[] = [];

    function visit(node: ts.Node) {
        if (ts.isVariableStatement(node)) {
            for (const decl of node.declarationList.declarations) {
                if (ts.isIdentifier(decl.name) && decl.name.text === targetVar && decl.initializer) {
                    if (ts.isObjectLiteralExpression(decl.initializer)) {
                        keys = flattenObjectLiteral(decl.initializer);
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sf);
    return keys;
}

async function main() {
    const absI18 = path.resolve(process.cwd(), i18Path);
    const txt = await fs.readFile(absI18, 'utf8');

    const allKeys = extractKeysFromFile(txt, absI18, varName);
    if (!allKeys.length) {
        console.error(`Could not find object literal for variable "${varName}" in ${i18Path}. ` + `Use --var=<variable_name> if it's named differently.`);
        process.exit(1);
    }

    // collect project files
    const files = await fg([`${srcDir}/**/*.{ts,tsx,js,jsx}`], {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        dot: false
    });

    const fileContents = new Map<string, string>();
    async function getContent(p: string) {
        if (!fileContents.has(p)) fileContents.set(p, await fs.readFile(p, 'utf8'));
        return fileContents.get(p)!;
    }

    const unused: string[] = [];

    for (const key of allKeys) {
        const re = new RegExp(`\\bi18\\.${escapeForRegex(key)}\\b`);
        let used = false;
        for (const f of files) {
            const content = await getContent(f);
            if (re.test(content)) {
                used = true;
                break;
            }
        }
        if (!used) unused.push(key);
    }

    if (unused.length === 0) {
        console.log('✅ All i18n keys are used (dot notation).');
        return;
    }

    console.log('🚩 Unused i18n keys (dot notation):');
    for (const k of unused) console.log(' -', k);
    console.log(`\nTotal unused: ${unused.length}`);
    process.exitCode = 1;
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
