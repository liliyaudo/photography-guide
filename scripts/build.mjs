import assert from 'node:assert/strict';
import { copyFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
// Publish only website resources, never the local server, notes or screenshots.
const files = ['index.html', 'src/app.js', 'src/styles.css', 'data/guide.json'];

for (const file of ['src/app.js', 'server.mjs']) {
  const checked = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
  if (checked.error) throw checked.error;
  assert.equal(checked.status, 0, checked.stderr || `${file} syntax check failed`);
}
const guide = JSON.parse(await readFile(path.join(root, 'data/guide.json'), 'utf8'));
for (const category of ['scenes', 'rescue', 'articles']) assert.ok(Array.isArray(guide[category]), `Missing data array: ${category}`);
const html = await readFile(path.join(root, 'index.html'), 'utf8');
assert.ok(html.includes('/src/app.js') && html.includes('/src/styles.css'), 'Entry asset paths are missing');
const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
assert.equal(config.outputDirectory, 'dist');
assert.equal(config.framework, null);

for (const file of files) {
  const destination = path.join(output, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(root, file), destination);
  assert.deepEqual(await readFile(destination), await readFile(path.join(root, file)), `Copy mismatch: ${file}`);
}

// Reject unexpected files in an existing output directory rather than publish them.
async function list(directory, prefix = '') {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) found.push(...await list(path.join(directory, entry.name), relative + '/'));
    else found.push(relative);
  }
  return found;
}
assert.deepEqual((await list(output)).sort(), [...files].sort(), 'Unexpected files in dist; move them out before building');
console.log(`Build successful: ${files.length} unchanged website files → dist/`);
console.log('Vercel preset: Other. Hash routes require no rewrites.');
