import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const distDir = join(root, 'dist');
const bundleDir = join(distDir, 'mcpb');

const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
const bundleVersion = packageJson.version;
const bundleName = `prompt-repository-mcp-${bundleVersion}.mcpb`;
const bundlePath = join(distDir, bundleName);

await mkdir(distDir, { recursive: true });
await rm(bundleDir, { recursive: true, force: true });
await rm(bundlePath, { force: true });
await mkdir(join(bundleDir, 'server'), { recursive: true });

manifest.version = bundleVersion;

await writeFile(join(bundleDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(join(bundleDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
await copyFile(join(root, 'src', 'index.js'), join(bundleDir, 'server', 'index.js'));

try {
  execFileSync('zip', ['-qr', bundlePath, '.'], {
    cwd: bundleDir,
    stdio: 'inherit'
  });
} catch (error) {
  throw new Error('Failed to create .mcpb archive. Ensure the `zip` command is available.');
}

console.log(`Created ${bundlePath}`);
