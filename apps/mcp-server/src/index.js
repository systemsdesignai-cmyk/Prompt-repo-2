#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const protocolVersion = '2024-11-05';
const serverVersion = '1.0.0';
const here = dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = resolve(process.env.PROMPT_REPOSITORY_ROOT || process.cwd());

const textFileExtensions = new Set(['.md', '.mdx', '.txt', '.json', '.yaml', '.yml']);
const ignoredDirectories = new Set([
  '.git',
  '.turbo',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'test-results',
  'playwright-report'
]);

const tools = [
  {
    name: 'health',
    description: 'Check whether the Prompt Repository MCP server is running.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'search_prompts',
    description: 'Search local prompt, prompt-pack, and skill files by text query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Case-insensitive text to search for.' },
        root: { type: 'string', description: 'Optional repository root. Defaults to current working directory.' },
        limit: { type: 'number', description: 'Maximum matches to return. Defaults to 20.' }
      },
      required: ['query'],
      additionalProperties: false
    }
  },
  {
    name: 'create_prompt_pack',
    description: 'Create a Markdown prompt-pack file from structured inputs.',
    inputSchema: {
      type: 'object',
      properties: {
        packId: { type: 'string', description: 'Stable hyphen-case pack id.' },
        name: { type: 'string', description: 'Human-facing pack name.' },
        summary: { type: 'string', description: 'One-sentence pack summary.' },
        root: { type: 'string', description: 'Optional repository root.' },
        outputDir: { type: 'string', description: 'Optional output directory relative to root. Defaults to prompt-packs.' },
        prompts: {
          type: 'array',
          description: 'Prompt entries to include in the pack.',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              body: { type: 'string' },
              triggers: { type: 'array', items: { type: 'string' } }
            },
            required: ['title', 'body'],
            additionalProperties: false
          }
        },
        overwrite: { type: 'boolean', description: 'Overwrite an existing pack file. Defaults to false.' }
      },
      required: ['packId', 'name', 'summary'],
      additionalProperties: false
    }
  },
  {
    name: 'validate_prompt_pack',
    description: 'Validate a local Markdown prompt-pack file for required metadata and sections.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Prompt-pack file path, relative to root unless absolute.' },
        root: { type: 'string', description: 'Optional repository root.' }
      },
      required: ['path'],
      additionalProperties: false
    }
  },
  {
    name: 'install_skill',
    description: 'Generate the local skills CLI install command for a GitHub-hosted skill.',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'GitHub owner or organization.' },
        repo: { type: 'string', description: 'GitHub repository name.' },
        skill: { type: 'string', description: 'Optional skill name for multi-skill repositories.' },
        global: { type: 'boolean', description: 'Add -g for global/user-level install. Defaults to true.' },
        yes: { type: 'boolean', description: 'Add -y to skip CLI prompts. Defaults to true.' }
      },
      required: ['owner', 'repo'],
      additionalProperties: false
    }
  },
  {
    name: 'publish_manifest',
    description: 'Create or update a skills.sh.json marketplace grouping manifest.',
    inputSchema: {
      type: 'object',
      properties: {
        root: { type: 'string', description: 'Optional repository root.' },
        title: { type: 'string', description: 'Marketplace grouping title.' },
        description: { type: 'string', description: 'Marketplace grouping description.' },
        skills: { type: 'array', items: { type: 'string' }, description: 'Skill names to group.' },
        notGrouped: { type: 'string', enum: ['top', 'bottom', 'hidden'], description: 'Where ungrouped skills appear.' },
        overwrite: { type: 'boolean', description: 'Overwrite an existing skills.sh.json. Defaults to false.' }
      },
      required: ['title', 'description', 'skills'],
      additionalProperties: false
    }
  },
  {
    name: 'sync_repository',
    description: 'Summarize local prompt repository assets and return install/bundle next steps.',
    inputSchema: {
      type: 'object',
      properties: {
        root: { type: 'string', description: 'Optional repository root.' },
        owner: { type: 'string', description: 'Optional GitHub owner for install command output.' },
        repo: { type: 'string', description: 'Optional GitHub repo for install command output.' },
        skill: { type: 'string', description: 'Skill name to include in install command. Defaults to prompt-repository.' }
      },
      additionalProperties: false
    }
  }
];

let buffer = '';
let messageQueue = Promise.resolve();

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;

  for (;;) {
    const newlineIndex = buffer.indexOf('\n');
    if (newlineIndex === -1) {
      return;
    }

    const rawMessage = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);

    if (rawMessage.length > 0) {
      messageQueue = messageQueue
        .then(() => handleRawMessage(rawMessage))
        .catch((error) => {
          sendError(null, -32000, 'Message processing failed', error.message);
        });
    }
  }
});

async function handleRawMessage(rawMessage) {
  let message;

  try {
    message = JSON.parse(rawMessage);
  } catch (error) {
    sendError(null, -32700, 'Parse error', error.message);
    return;
  }

  if (!message || typeof message !== 'object') {
    sendError(null, -32600, 'Invalid Request');
    return;
  }

  try {
    await handleMessage(message);
  } catch (error) {
    sendError(message.id, -32000, 'Tool execution failed', error.message);
  }
}

async function handleMessage(message) {
  const { id, method, params } = message;

  if (method === 'initialize') {
    sendResult(id, {
      protocolVersion,
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'prompt-repository-mcp-server',
        version: serverVersion
      }
    });
    return;
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'tools/list') {
    sendResult(id, { tools });
    return;
  }

  if (method === 'tools/call') {
    await callTool(id, params);
    return;
  }

  sendError(id, -32601, `Method not found: ${method}`);
}

async function callTool(id, params = {}) {
  const name = params.name;
  const args = params.arguments || {};

  const handlers = {
    health,
    search_prompts: searchPrompts,
    create_prompt_pack: createPromptPack,
    validate_prompt_pack: validatePromptPack,
    install_skill: installSkill,
    publish_manifest: publishManifest,
    sync_repository: syncRepository
  };

  const handler = handlers[name];

  if (!handler) {
    sendError(id, -32602, `Unknown tool: ${name}`);
    return;
  }

  const result = await handler(args);
  sendTextResult(id, result);
}

async function health() {
  return {
    status: 'ok',
    message: 'Prompt Repository MCP server is running.',
    version: serverVersion,
    tools: tools.map((tool) => tool.name)
  };
}

async function searchPrompts(args) {
  const query = requiredString(args.query, 'query').toLowerCase();
  const root = getRoot(args.root);
  const limit = Math.min(Math.max(Number(args.limit || 20), 1), 100);
  const searchRoots = await existingSearchRoots(root);
  const matches = [];

  for (const searchRoot of searchRoots) {
    await walkFiles(searchRoot, async (filePath) => {
      if (matches.length >= limit || !textFileExtensions.has(extname(filePath))) {
        return;
      }

      const content = await readFile(filePath, 'utf8');
      const lines = content.split(/\r?\n/);
      const lineIndex = lines.findIndex((line) => line.toLowerCase().includes(query));

      if (lineIndex !== -1) {
        matches.push({
          path: relative(root, filePath),
          line: lineIndex + 1,
          preview: lines[lineIndex].trim().slice(0, 240)
        });
      }
    });
  }

  return {
    query: args.query,
    root,
    count: matches.length,
    matches
  };
}

async function createPromptPack(args) {
  const packId = requiredString(args.packId, 'packId');
  const name = requiredString(args.name, 'name');
  const summary = requiredString(args.summary, 'summary');

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(packId)) {
    throw new Error('packId must be hyphen-case with lowercase letters and digits.');
  }

  const root = getRoot(args.root);
  const outputDir = safeResolve(root, args.outputDir || 'prompt-packs');
  const outputPath = join(outputDir, `${packId}.md`);

  if (existsSync(outputPath) && args.overwrite !== true) {
    throw new Error(`Prompt pack already exists: ${relative(root, outputPath)}. Pass overwrite: true to replace it.`);
  }

  const prompts = Array.isArray(args.prompts) ? args.prompts : [];
  const content = renderPromptPack({ packId, name, summary, prompts });

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, content);

  return {
    created: true,
    path: relative(root, outputPath),
    promptCount: prompts.length
  };
}

async function validatePromptPack(args) {
  const root = getRoot(args.root);
  const filePath = safeResolve(root, requiredString(args.path, 'path'));
  const content = await readFile(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);
  const errors = [];
  const warnings = [];

  for (const field of ['id', 'name', 'version', 'summary']) {
    if (!frontmatter[field]) {
      errors.push(`Missing frontmatter field: ${field}`);
    }
  }

  if (frontmatter.id && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.id)) {
    errors.push('frontmatter id must be hyphen-case with lowercase letters and digits.');
  }

  for (const section of ['Triggers', 'Inputs', 'Output', 'Constraints', 'Prompt']) {
    if (!new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, 'im').test(body)) {
      warnings.push(`Missing recommended section: ${section}`);
    }
  }

  return {
    valid: errors.length === 0,
    path: relative(root, filePath),
    errors,
    warnings,
    frontmatter
  };
}

async function installSkill(args) {
  const owner = requiredString(args.owner, 'owner');
  const repo = requiredString(args.repo, 'repo');
  const command = ['npx', 'skills', 'add', `${owner}/${repo}`];

  if (args.skill) {
    command.push('--skill', String(args.skill));
  }

  if (args.global !== false) {
    command.push('-g');
  }

  if (args.yes !== false) {
    command.push('-y');
  }

  return {
    command: command.join(' '),
    note: 'Run this command locally to install the skill. This MCP tool does not execute network installs.'
  };
}

async function publishManifest(args) {
  const root = getRoot(args.root);
  const skills = requiredArray(args.skills, 'skills');
  const manifestPath = join(root, 'skills.sh.json');

  if (existsSync(manifestPath) && args.overwrite !== true) {
    throw new Error('skills.sh.json already exists. Pass overwrite: true to replace it.');
  }

  const manifest = {
    $schema: 'https://skills.sh/schemas/skills.sh.schema.json',
    notGrouped: args.notGrouped || 'bottom',
    groupings: [
      {
        title: requiredString(args.title, 'title'),
        description: requiredString(args.description, 'description'),
        skills
      }
    ]
  };

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  return {
    written: true,
    path: relative(root, manifestPath),
    manifest
  };
}

async function syncRepository(args) {
  const root = getRoot(args.root);
  const skill = args.skill || 'prompt-repository';
  const skillPath = join(root, 'skills', skill, 'SKILL.md');
  const manifestPath = join(root, 'skills.sh.json');
  const mcpManifestPath = join(root, 'apps', 'mcp-server', 'manifest.json');
  const mcpBundlePath = join(root, 'apps', 'mcp-server', 'dist', `prompt-repository-mcp-${serverVersion}.mcpb`);

  const counts = {
    skills: await countDirectories(join(root, 'skills')),
    promptPacks: await countFiles(join(root, 'prompt-packs')),
    prompts: await countFiles(join(root, 'prompts'))
  };

  const result = {
    root,
    paths: {
      skill: relative(root, skillPath),
      skillsManifest: relative(root, manifestPath),
      mcpManifest: relative(root, mcpManifestPath),
      mcpBundle: relative(root, mcpBundlePath)
    },
    exists: {
      skill: existsSync(skillPath),
      skillsManifest: existsSync(manifestPath),
      mcpManifest: existsSync(mcpManifestPath),
      mcpBundle: existsSync(mcpBundlePath)
    },
    counts,
    commands: {
      buildMcpBundle: 'npm run mcp:bundle'
    }
  };

  if (args.owner && args.repo) {
    result.commands.installSkill = `npx skills add ${args.owner}/${args.repo} --skill ${skill} -g -y`;
  }

  return result;
}

function renderPromptPack({ packId, name, summary, prompts }) {
  const promptSections = prompts.length > 0
    ? prompts.map((prompt, index) => {
        const triggers = Array.isArray(prompt.triggers) && prompt.triggers.length > 0
          ? prompt.triggers.map((trigger) => `- ${trigger}`).join('\n')
          : '- Add trigger phrases here.';

        return `### ${index + 1}. ${prompt.title}\n\nTriggers:\n\n${triggers}\n\nPrompt:\n\n${prompt.body}\n`;
      }).join('\n')
    : 'Add prompt entries here.\n';

  return `---\nid: ${packId}\nname: ${name}\nversion: 0.1.0\nsummary: ${summary}\n---\n\n# ${name}\n\n## Triggers\n\n- Add user request patterns that should use this pack.\n\n## Inputs\n\nRequired:\n\n- Add required inputs.\n\nOptional:\n\n- Add optional context.\n\n## Output\n\nReturn Markdown with task-appropriate sections.\n\n## Constraints\n\n- Keep outputs scoped to the user's request.\n\n## Prompt\n\n${promptSections}\n`;
}

async function existingSearchRoots(root) {
  const candidates = ['prompts', 'prompt-packs', 'skills'].map((name) => join(root, name));
  const existing = candidates.filter((candidate) => existsSync(candidate));
  return existing.length > 0 ? existing : [root];
}

async function walkFiles(directory, onFile) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await walkFiles(entryPath, onFile);
      }
      continue;
    }

    if (entry.isFile()) {
      await onFile(entryPath);
    }
  }
}

function parseFrontmatter(content) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(content);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const fieldMatch = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (fieldMatch) {
      frontmatter[fieldMatch[1]] = fieldMatch[2].replace(/^["']|["']$/g, '');
    }
  }

  return {
    frontmatter,
    body: content.slice(match[0].length)
  };
}

async function countDirectories(directory) {
  if (!existsSync(directory)) {
    return 0;
  }

  const entries = await readdir(directory, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).length;
}

async function countFiles(directory) {
  if (!existsSync(directory)) {
    return 0;
  }

  let count = 0;
  await walkFiles(directory, async () => {
    count += 1;
  });
  return count;
}

function getRoot(root) {
  const resolvedRoot = resolve(root || defaultRepositoryRoot);

  if (!existsSync(resolvedRoot)) {
    throw new Error(`Repository root does not exist: ${resolvedRoot}`);
  }

  return resolvedRoot;
}

function safeResolve(root, path) {
  const resolvedPath = resolve(root, path);
  const relativePath = relative(root, resolvedPath);

  if (relativePath.startsWith('..') || relativePath === '..' || relativePath.includes(`..${separatorForPath()}`)) {
    throw new Error(`Path escapes repository root: ${path}`);
  }

  return resolvedPath;
}

function separatorForPath() {
  return process.platform === 'win32' ? '\\' : '/';
}

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required and must be a non-empty string.`);
  }

  return value.trim();
}

function requiredArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${field} is required and must be a non-empty array.`);
  }

  return value.map((item) => requiredString(item, field));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sendTextResult(id, result) {
  sendResult(id, {
    content: [
      {
        type: 'text',
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      }
    ]
  });
}

function sendResult(id, result) {
  if (id === undefined || id === null) {
    return;
  }

  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
}

function sendError(id, code, message, data) {
  const error = { code, message };

  if (data !== undefined) {
    error.data = data;
  }

  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error })}\n`);
}
