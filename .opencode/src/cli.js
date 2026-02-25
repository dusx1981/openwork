#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync, mkdirSync, cpSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SKILLS_DIR = join(__dirname, 'skills');
const AGENTS_DIR = join(__dirname, 'agents');
const HOME_OPENCODE = join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'opencode');

const kleur = await import('kleur').then(m => m.default || m);

function log(msg) {
  console.log(kleur.cyan('[ecommerce]') + ' ' + msg);
}

function error(msg) {
  console.error(kleur.red('[error]') + ' ' + msg);
}

function success(msg) {
  console.log(kleur.green('[ok]') + ' ' + msg);
}

function getTargetDir() {
  return process.argv[2] || process.cwd();
}

function install() {
  const targetDir = getTargetDir();
  const skillsTarget = join(targetDir, '.opencode', 'skills');
  const agentsTarget = join(targetDir, '.opencode', 'agents');

  log('Installing to: ' + targetDir);

  // Install skills
  if (existsSync(SKILLS_DIR)) {
    mkdirSync(skillsTarget, { recursive: true });
    const skills = readdirSync(SKILLS_DIR);
    for (const skill of skills) {
      const src = join(SKILLS_DIR, skill);
      const dst = join(skillsTarget, skill);
      cpSync(src, dst, { recursive: true });
      success(`installed skill: ${skill}`);
    }
  }

  // Install agents
  if (existsSync(AGENTS_DIR)) {
    mkdirSync(agentsTarget, { recursive: true });
    const agents = readdirSync(AGENTS_DIR);
    for (const agent of agents) {
      const src = join(AGENTS_DIR, agent);
      const dst = join(agentsTarget, agent);
      cpSync(src, dst, { recursive: true });
      success(`installed agent: ${agent}`);
    }
  }

  log('Installation complete!');
}

function installGlobal() {
  log('Installing to global OpenCode config...');
  
  mkdirSync(join(HOME_OPENCODE, 'skills'), { recursive: true });
  mkdirSync(join(HOME_OPENCODE, 'agents'), { recursive: true });

  // Global install skills
  if (existsSync(SKILLS_DIR)) {
    const skills = readdirSync(SKILLS_DIR);
    for (const skill of skills) {
      const src = join(SKILLS_DIR, skill);
      const dst = join(HOME_OPENCODE, 'skills', skill);
      cpSync(src, dst, { recursive: true });
      success(`installed global skill: ${skill}`);
    }
  }

  // Global install agents
  if (existsSync(AGENTS_DIR)) {
    const agents = readdirSync(AGENTS_DIR);
    for (const agent of agents) {
      const src = join(AGENTS_DIR, agent);
      const dst = join(HOME_OPENCODE, 'agents', agent);
      cpSync(src, dst, { recursive: true });
      success(`installed global agent: ${agent}`);
    }
  }

  success('Global installation complete!');
}

function list() {
  log('Available ecommerce skills:');
  
  if (existsSync(SKILLS_DIR)) {
    const skills = readdirSync(SKILLS_DIR);
    for (const skill of skills) {
      const skillFile = join(SKILLS_DIR, skill, 'SKILL.md');
      if (existsSync(skillFile)) {
        const content = readFileSync(skillFile, 'utf-8');
        const match = content.match(/description:\s*(.+)/);
        const desc = match ? match[1] : 'No description';
        console.log(`  - ${kleur.yellow(skill)}: ${desc}`);
      }
    }
  }

  log('\nAvailable ecommerce agents:');
  
  if (existsSync(AGENTS_DIR)) {
    const agents = readdirSync(AGENTS_DIR);
    for (const agent of agents) {
      const agentFile = join(AGENTS_DIR, agent, 'AGENT.md');
      if (existsSync(agentFile)) {
        const content = readFileSync(agentFile, 'utf-8');
        const match = content.match(/description:\s*(.+)/);
        const desc = match ? match[1] : 'No description';
        console.log(`  - ${kleur.cyan('@' + agent)}: ${desc}`);
      }
    }
  }
}

function help() {
  console.log(`
${kleur.bold('OpenWork E-commerce Agents Package')}

${kleur.yellow('Usage:')}
  ecommerce-agent <command> [options]

${kleur.yellow('Commands:')}
  install [dir]    Install skills and agents to specified directory (default: current dir)
  install-global  Install to global ~/.config/opencode/ 
  list            List available skills and agents
  help            Show this help message

${kleur.yellow('Examples:')}
  ecommerce-agent install
  ecommerce-agent install ./my-project
  ecommerce-agent install-global
  ecommerce-agent list
`);
}

const command = process.argv[2];

switch (command) {
  case 'install':
    if (process.argv[3] === '--global' || process.argv[3] === '-g') {
      installGlobal();
    } else {
      install();
    }
    break;
  case 'install-global':
    installGlobal();
    break;
  case 'list':
    list();
    break;
  case 'help':
  case '--help':
  case '-h':
  default:
    help();
}
