#!/usr/bin/env node

import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

const args = process.argv.slice(2);

if (args.includes('--help') || args.length < 2) {
  printUsage();
  process.exit(args.includes('--help') ? 0 : 1);
}

const [owner, repo] = args;
const tag = readFlag('--tag');
const outputDir = resolve(expandHome(readFlag('--output') || '~/Downloads'));
const releaseUrl = tag
  ? `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`
  : `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

await mkdir(outputDir, { recursive: true });

const release = await getJson(releaseUrl);
const asset = release.assets?.find((item) => item.name.endsWith('.mcpb'));

if (!asset) {
  throw new Error(`No .mcpb asset found on release ${release.tag_name || tag || 'latest'}.`);
}

const outputPath = join(outputDir, basename(asset.name));
await download(asset.browser_download_url, outputPath);

console.log(JSON.stringify({
  downloaded: true,
  release: release.tag_name,
  asset: asset.name,
  path: outputPath
}, null, 2));

function readFlag(name) {
  const index = args.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value.`);
  }

  return value;
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'prompt-repository-skill'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function download(url, outputPath) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'prompt-repository-skill'
    }
  });

  if (!response.ok || !response.body) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  await pipeline(response.body, createWriteStream(outputPath));
}

function expandHome(value) {
  if (value === '~') {
    return process.env.HOME || value;
  }

  if (value.startsWith('~/')) {
    return join(process.env.HOME || '~', value.slice(2));
  }

  return value;
}

function printUsage() {
  console.log(`Usage:
  node scripts/download-mcp-bundle.mjs <owner> <repo> [--tag <tag>] [--output <dir>]

Examples:
  node scripts/download-mcp-bundle.mjs your-org prompt-repo
  node scripts/download-mcp-bundle.mjs your-org prompt-repo --tag mcp-v0.3.0 --output ~/Downloads`);
}
