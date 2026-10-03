import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const guide = JSON.parse(await readFile(new URL('../data/guide.json', import.meta.url), 'utf8'));
const cards = [...guide.scenes, ...guide.rescue, ...guide.articles];
assert.equal(new Set(cards.map(c => c.id)).size, cards.length, '卡片 ID 必须唯一');
assert.equal(guide.scenes.length, 10);
assert.equal(guide.rescue.length, 9);
for (const scene of guide.scenes) for (const key of ['mode','focalLength','aperture','shutter','iso','kelvin','wbShift','flash','focus','tips','warnings']) assert.ok(scene[key], `${scene.id} 缺少 ${key}`);
const normalize = value => String(value).toLowerCase().replace(/[\s/·，、。～–—\-]/g, '');
for (const query of ['K值','B5G1','M1','闪光补偿','1/160','f/5.6','阴天','直闪','人太黄']) assert.ok(cards.some(c => normalize(JSON.stringify(c)).includes(normalize(query).replace('闪光补偿', '闪光曝光补偿'))), `搜索无结果：${query}`);
const base = `http://localhost:${process.env.PORT || 4173}`;
for (const url of ['/', '/src/styles.css', '/src/app.js', '/data/guide.json']) {
  const response = await fetch(base + url); assert.equal(response.status, 200, url); assert.ok((await response.text()).length > 0);
}
assert.equal((await fetch(base + '/not-a-file')).status, 404);
console.log(`检查通过：${cards.length} 张知识卡、10 个场景、9 个救命问题、9 组搜索、4 个 HTTP 资源及 404。`);
