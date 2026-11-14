// OpenCode plugin entry: registers skills/markdown-convert only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'skills');

export function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content: text };
  const frontmatter = {};
  let key = null;
  for (const raw of match[1].split('\n')) {
    const line = raw.replace(/\r$/, '');
    const top = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (top) {
      key = top[1];
      frontmatter[key] = /^[>|][+-]?$/.test(top[2]) ? '' : top[2].trim();
    } else if (key && /^\s+\S/.test(line)) {
      frontmatter[key] = `${frontmatter[key]} ${line.trim()}`.trim();
    }
  }
  for (const k of Object.keys(frontmatter)) {
    frontmatter[k] = frontmatter[k].replace(/^(["'])([\s\S]*)\1$/, '$2');
  }
  return { frontmatter, content: match[2] };
}

export function listSkills(dir = skillsDir) {
  if (!fs.existsSync(dir)) return [];
  const skills = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const skillPath = path.join(dir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    const { frontmatter, content } = parseFrontmatter(fs.readFileSync(skillPath, 'utf8'));
    skills.push({
      id: entry.name,
      name: frontmatter.name || entry.name,
      ...(frontmatter.description ? { description: frontmatter.description } : {}),
      path: skillPath,
      content,
    });
  }
  return skills;
}

export const MarkdownConvertPlugin = async () => ({
  config: async (config) => {
    if (Array.isArray(config.skills)) return;
    config.skills = config.skills || {};
    config.skills.paths = config.skills.paths || [];
    if (!config.skills.paths.includes(skillsDir)) config.skills.paths.push(skillsDir);
  },
});

async function setup(ctx) {
  if (!ctx?.skill || typeof ctx.skill.transform !== 'function') return;
  const skills = listSkills();
  await ctx.skill.transform((draft) => {
    for (const skill of skills) {
      draft.add(skill);
    }
  });
}

export default { id: 'markdown-convert-mcp', server: MarkdownConvertPlugin, setup };