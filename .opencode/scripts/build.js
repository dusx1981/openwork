import { mkdirSync, cpSync, existsSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const srcDir = join(rootDir, 'src');

console.log('Building ecommerce agents package...');

// Create dist directory
mkdirSync(distDir, { recursive: true });

// Copy CLI
const cliSrc = join(srcDir, 'cli.js');
const cliDst = join(distDir, 'cli.js');
cpSync(cliSrc, cliDst);
console.log('Copied CLI to dist/cli.js');

// Copy skills
const skillsSrc = join(rootDir, 'skills');
const skillsDst = join(distDir, 'skills');
if (existsSync(skillsSrc)) {
  mkdirSync(skillsDst, { recursive: true });
  const skills = readdirSync(skillsSrc);
  for (const skill of skills) {
    const src = join(skillsSrc, skill);
    const dst = join(skillsDst, skill);
    cpSync(src, dst, { recursive: true });
    console.log(`Copied skill: ${skill}`);
  }
}

// Copy agents
const agentsSrc = join(rootDir, 'agents');
const agentsDst = join(distDir, 'agents');
if (existsSync(agentsSrc)) {
  mkdirSync(agentsDst, { recursive: true });
  const agents = readdirSync(agentsSrc);
  for (const agent of agents) {
    const src = join(agentsSrc, agent);
    const dst = join(agentsDst, agent);
    cpSync(src, dst, { recursive: true });
    console.log(`Copied agent: ${agent}`);
  }
}

// Create package.json for dist
const packageJson = {
  "name": "@openwork/ecommerce-agents",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "ecommerce-agent": "./cli.js"
  }
};
writeFileSync(join(distDir, 'package.json'), JSON.stringify(packageJson, null, 2));

console.log('Build complete!');
