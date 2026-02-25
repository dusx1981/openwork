#!/usr/bin/env node

import { join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

console.log('__dirname:', __dirname);

// Test the path construction
const name = 'e-commerce-agent-hub';
const localSkillPath = join(__dirname, "..", "app", "public", "builtin", "skills", name, "SKILL.md");

console.log('Constructed path:', localSkillPath);
console.log('File exists:', existsSync(localSkillPath));

// Also test alternative path
const altPath = join(__dirname, "..", "..", "app", "public", "builtin", "skills", name, "SKILL.md");
console.log('Alternative path:', altPath);
console.log('Alt file exists:', existsSync(altPath));