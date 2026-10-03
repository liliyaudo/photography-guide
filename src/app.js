const app = document.querySelector('#app');
const categories = { home: '首页', scenes: '场景参数速查', rescue: '现场救命模式', light: '找光与焦段', modes: 'M 档 / Av 档', exposure: '曝光三要素', flash: '闪光摄影', wb: '白平衡与肤色', style: 'Picture Style', personal: '我的经验', extra: '后期与练习' };
const glyphs = { home: '⌂', scenes: '▦', rescue: '＋', light: '☼', modes: 'M', exposure: '◒', flash: 'ϟ', wb: '◈', style: '◧', personal: '☆', extra: '↗' };
let guide, cards = [], sceneFilter = '全部', query = '', rescueId = '', wbSelected = new Set();
let memory = { cards: {}, experiences: [], theme: 'light' };
let storageFailed = false;
try { const saved = JSON.parse(localStorage.getItem('lili-guide-v1') || 'null'); if (saved && typeof saved === 'object') memory = { ...memory, ...saved, cards: saved.cards || {}, experiences: Array.isArray(saved.experiences) ? saved.experiences : [] }; } catch { storageFailed = true; }
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const normalize = value => String(value).toLowerCase().replace(/[\s/·，、。～–—\-]/g, '');
function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('visible'), 2600); }
function save() { try { localStorage.setItem('lili-guide-v1', JSON.stringify(memory)); return true; } catch { storageFailed = true; toast('浏览器无法保存：本次修改仅在当前页面保留。'); return false; } }
function applyTheme() { document.documentElement.dataset.theme = memory.theme === 'dark' ? 'dark' : 'light'; document.querySelector('#theme-toggle').setAttribute('aria-label', memory.theme === 'dark' ? '切换浅色模式' : '切换深色模式'); }
applyTheme();
document.querySelector('#theme-toggle').addEventListener('click', () => { memory.theme = memory.theme === 'dark' ? 'light' : 'dark'; applyTheme(); save(); });
const page = () => (location.hash.slice(1) || 'home').split('/')[0];
function nav() {
  const current = page();
  document.querySelector('#desktop-nav').innerHTML = Object.entries(categories).map(([id, title]) => `<a href="#${id}" class="nav-link ${current === id ? 'active' : ''}" ${current === id ? 'aria-current="page"' : ''}><span>${glyphs[id]}</span>${title}</a>`).join('');
  document.querySelector('#mobile-nav').innerHTML = [['home', '首页'], ['scenes', '场景'], ['rescue', '救命'], ['wb', '肤色'], ['personal', '我的']].map(([id, title]) => `<a href="#${id}" class="${current === id ? 'active' : ''}" ${current === id ? 'aria-current="page"' : ''}><span>${glyphs[id]}</span>${title}</a>`).join('');
}
function pageHead(title, description, label = 'FIELD NOTES') { return `<div class="page-heading"><span class="eyebrow">${label}</span><h1>${title}</h1><p>${description}</p></div>`; }
function searchBox() { return `<form id="search-form" class="search-box" role="search"><span aria-hidden="true">⌕</span><input id="search-input" type="search" autocomplete="off" aria-label="搜索摄影知识" placeholder="搜索问题、场景或参数，如 B5G1、1/160…" value="${escape(query)}"><kbd>/</kbd></form>`; }
function personalTools(card) {
  const saved = memory.cards[card.id] || {};
  return `<div class="card-tools"><button class="tool-button ${saved.favorite ? 'selected' : ''}" data-favorite="${card.id}" aria-pressed="${!!saved.favorite}">${saved.favorite ? '★ 已收藏' : '☆ 收藏'}</button><button class="tool-button ${saved.verified ? 'selected' : ''}" data-verified="${card.id}" aria-pressed="${!!saved.verified}">${saved.verified ? '✓ 已验证有效' : '✓ 这次验证有效'}</button><details class="note-details"><summary>✎ ${saved.note ? '查看备注' : '添加备注'}</summary><label>个人现场备注<textarea data-note="${card.id}" rows="3" placeholder="这次的光线、参数、肤色变化…">${escape(saved.note || '')}</textarea></label><button class="small-button" data-save-note="${card.id}">保存备注</button></details></div>`;
}
function parameterGrid(card) {
  const fields = [['mode', '模式'], ['focalLength', '焦距'], ['aperture', '光圈'], ['shutter', '快门'], ['iso', 'ISO'], ['kelvin', 'K 值 / WB'], ['wbShift', 'WB Shift'], ['flash', '闪光'], ['focus', '对焦']];
  return `<dl class="parameter-grid">${fields.map(([key, label]) => `<div class="${key === 'focus' ? 'wide' : ''}"><dt>${label}</dt><dd>${escape(card[key])}</dd></div>`).join('')}</dl>`;
}
function knowledgeCard(card) {
  let content = '';
  if (card.category === 'scenes') content = parameterGrid(card) + `<div class="card-section"><h3>现场怎么做</h3><ul>${card.tips.map(x => `<li>${escape(x)}</li>`).join('')}</ul></div><div class="warning"><span>留意</span>${card.warnings.map(escape).join('<br>')}</div>`;
  else if (card.category === 'rescue') content = `<div class="check"><span>先检查</span><p>${escape(card.check)}</p></div><ol class="steps">${card.steps.map((x, i) => `<li><span>0${i + 1}</span><p>${escape(x)}</p></li>`).join('')}</ol><div class="warning"><span>不要做</span>${escape(card.avoid)}</div>`;
  else content = `${card.summary ? `<p class="card-summary">${escape(card.summary)}</p>` : ''}${card.values ? `<dl class="parameter-grid style-grid">${Object.entries(card.values).map(([k, v]) => `<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl>` : ''}${card.sections.map(s => `<div class="card-section"><h3>${escape(s.title)}</h3><ul>${s.items.map(x => `<li>${escape(x)}</li>`).join('')}</ul></div>`).join('')}`;
  return `<article class="knowledge-card" id="card-${card.id}"><div class="card-topline"><span class="tag">${escape(card.lightType || categories[card.category])}</span><a class="permalink" href="#detail/${card.id}" aria-label="打开${escape(card.title)}详情">↗</a></div><h2>${escape(card.title)}</h2>${content}${personalTools(card)}</article>`;
}
function preview(card) { return `<a class="result-card" href="#detail/${card.id}"><span class="eyebrow">${escape(categories[card.category])}</span><h3>${escape(card.title)} <span>↗</span></h3><p>${escape(card.summary || card.check || `${card.mode} · ${card.focalLength} · ${card.shutter}`)}</p></a>`; }
function home() {
  const featured = guide.scenes.filter(c => ['overcast', 'window', 'direct-flash'].includes(c.id));
  return `<section class="hero"><div class="hero-copy"><span class="eyebrow">LILI / PERSONAL FIELD GUIDE</span><h1>先找光，<br>再按下快门<span class="hero-dot">。</span></h1><p>把人拍清楚，把肤色拍自然。<br>你的单人人像现场操作手册。</p><div class="hero-actions"><a class="primary-button" href="#scenes">今天怎么拍 <span>↗</span></a><a class="secondary-button" href="#rescue">拍崩了怎么办 <span>＋</span></a></div><span class="hero-meta">CANON EOS 90D <i></i> 18–135mm <i></i> 单人人像</span></div><div class="hero-graphic" aria-hidden="true"><div class="viewfinder"><div class="lens-circle"><div class="lens-inner"><div class="focus-point"></div></div></div><span class="viewfinder-label">FOCUS ON THE LIGHT</span><span class="frame-number">01 / FIELD GUIDE</span></div></div></section>
  <div class="principle-strip"><span>现场优先级</span><strong>不糊 <b>→</b> 曝光正常 <b>→</b> ISO 低</strong><a href="#exposure">记住这三个 ↗</a></div>
  <section><div class="section-heading"><div><span class="eyebrow">01 / QUICK START</span><h2>今天，在哪拍？</h2></div><a href="#scenes">全部 10 个场景 ↗</a></div><div class="scene-previews">${featured.map((c, i) => `<a class="scene-preview" href="#detail/${c.id}"><div class="scene-preview-top"><span>0${i + 1}</span><span>${c.lightType} ↗</span></div><h3>${c.title}</h3><p>${c.mode} <span>/</span> ${c.focalLength}</p><div class="preview-stats"><div><small>快门</small><strong>${c.shutter}</strong></div><div><small>白平衡</small><strong>${c.kelvin}</strong></div></div></a>`).join('')}</div></section>
  <section><div class="section-heading"><div><span class="eyebrow">02 / YOUR TOOLKIT</span><h2>现场口袋工具</h2></div><span class="muted">少记公式，多看脸。</span></div><div class="toolkit-grid">${[['light','找光','先看方向，再看亮度'],['modes','M / Av','快速抓拍，或主动做画面'],['exposure','曝光三要素','光圈、快门、ISO 的优先级'],['flash','闪光灯','背景看快门，人物看 FEC'],['wb','白平衡与肤色','K 值与 WB Shift 交互工具'],['style','Picture Style','两套稳妥的基础配方'],['rescue','拍崩了怎么办','9 个现场问题，一步步修正'],['personal','我的经验','收藏、备注与实拍记录']].map(([id,title,desc]) => `<a href="#${id}" class="toolkit-card"><span class="toolkit-icon">${glyphs[id]}</span><div><h3>${title}</h3><p>${desc}</p></div><span>↗</span></a>`).join('')}</div></section>
  <div class="footnote">参数是起点，不是标准答案。试拍一张，放大看眼睛，再看肤色与高光。<a href="#extra">后期 · 实拍练习 · 全家福 ↗</a></div>`;
}
function scenes() {
  const filters = ['全部', '自然光', '闪光', '室内', '构图'];
  const filtered = guide.scenes.filter(c => sceneFilter === '全部' || (sceneFilter === '自然光' && c.lightType === '自然光') || (sceneFilter === '闪光' && c.flash.includes('E-TTL')) || (sceneFilter === '室内' && ['indoor','window','direct-flash','warm'].includes(c.id)) || (sceneFilter === '构图' && ['half','full','close'].includes(c.id)));
  return pageHead('今天怎么拍', '先选择光线或构图，拿一组起点参数去试拍。', 'SCENE / 场景参数速查') + `<div class="chips" aria-label="筛选场景">${filters.map(f => `<button data-scene-filter="${f}" class="chip ${sceneFilter === f ? 'active' : ''}" aria-pressed="${sceneFilter === f}">${f}</button>`).join('')}</div><div class="info-banner">18–135mm 的最大光圈随焦段变化；所有参数按现场微调。静态对近侧眼睛，运动用 AI Servo。</div><div class="cards-grid">${filtered.map(knowledgeCard).join('')}</div>`;
}
function rescue() {
  const selected = guide.rescue.find(c => c.id === rescueId);
  return pageHead('拍崩了怎么办', '选最明显的问题。一次只改一个变量，试拍后再看。', 'SOS / 现场救命模式') + `<div class="rescue-grid">${guide.rescue.map((c,i) => `<button class="rescue-button ${c.id === rescueId ? 'active' : ''}" data-rescue="${c.id}" aria-pressed="${c.id === rescueId}" aria-controls="rescue-answer"><span>0${i + 1}</span>${c.title}<b>↗</b></button>`).join('')}</div><div id="rescue-answer" aria-live="polite">${selected ? knowledgeCard(selected) : `<div class="empty-state"><span>＋</span><h2>先定位问题，再动参数</h2><p>点击上方问题，查看检查顺序和两步修正。</p></div>`}</div>`;
}
function wbTools() {
  return `<section class="interactive-card"><div class="section-heading"><div><span class="eyebrow">01 / KELVIN</span><h2>K 值：从冷到暖</h2></div><output id="kelvin-output" for="kelvin-slider">5000 K</output></div><div id="kelvin-sample" class="kelvin-sample"><div class="sample-disc"></div><span>同一光源下的方向示意<br><small>不是实际肤色或相机预览</small></span></div><label class="slider-label" for="kelvin-slider">拖动查看手动白平衡的变化方向</label><input id="kelvin-slider" type="range" min="4300" max="5500" step="100" value="5000"><div class="range-labels"><span>4300K · 更冷</span><span>5000K · 起点</span><span>5500K · 更暖</span></div><p class="muted">白净、自然可从 4800–5200K 试起。实际结果取决于现场光源。</p></section>
  <section class="interactive-card"><div class="section-heading"><div><span class="eyebrow">02 / WB SHIFT</span><h2>脸的颜色，哪里不对？</h2></div><button id="wb-reset" class="text-button">重置</button></div><div class="wb-buttons">${[['yellow','太黄','B'],['blue','太蓝','A'],['green','太绿','M'],['pink','太粉','G']].map(([id,title,direction])=>`<button data-wb="${id}" class="chip" aria-pressed="false">${title} <span>→ ${direction}</span></button>`).join('')}</div><div class="wb-layout"><div class="wb-chart" aria-label="白平衡偏移坐标：上绿，下洋红，左蓝，右琥珀"><span class="axis g" data-axis="G">G <small>绿</small></span><span class="axis b" data-axis="B">B <small>蓝</small></span><span class="axis a" data-axis="A">A <small>琥珀</small></span><span class="axis m" data-axis="M">M <small>洋红</small></span><div class="chart-grid"><span id="wb-point"></span></div></div><div class="wb-result" aria-live="polite"><span class="eyebrow">建议修正方向</span><h3 id="wb-direction">0 · 先不偏移</h3><p id="wb-explanation">点一个偏色问题，可以组合黄蓝轴与绿洋红轴。</p><div class="warning"><span>小幅起步</span>每次 1–2 格，试拍回看脸。先修黄蓝，再修绿洋红。</div></div></div></section>`;
}
function flashDiagram() { return `<section class="flash-diagram"><div class="diagram-step"><span class="eyebrow">01 / 环境光</span><h2>先关闪，做背景</h2><p>比最终想要的暗 2/3～1 档</p><div class="diagram-controls">快门 <span>＋</span> ISO</div><small>背景暗 → 降快门 / 提 ISO</small></div><div class="diagram-arrow">→</div><div class="diagram-step"><span class="eyebrow">02 / 闪光</span><h2>再开闪，做人物</h2><p>保持环境参数，打开 E-TTL</p><div class="diagram-controls">FEC <span>闪光曝光补偿</span></div><small>人物暗 → 逐步加 FEC</small></div></section>`; }
function personal() {
  const saved = cards.filter(c => memory.cards[c.id]?.favorite || memory.cards[c.id]?.verified || memory.cards[c.id]?.note);
  return pageHead('我的现场经验', '记下你亲手验证过的设置，让手册慢慢变成自己的。', 'PERSONAL / 本机记录') + `<div class="info-banner">记录仅保存在当前浏览器。清理浏览器数据会丢失；建议定期导出备份。${storageFailed ? ' 当前浏览器存储不可用。' : ''}</div><div class="section-heading"><h2>实拍记录 <span class="count">${memory.experiences.length}</span></h2><div class="backup-actions"><button id="export-data" class="small-button">导出备份</button><label class="small-button import-label">导入备份<input id="import-data" type="file" accept="application/json,.json"></label></div></div><form id="experience-form" class="experience-form"><label>这次拍了什么<input name="title" required maxlength="100" placeholder="例如：窗边半身，5000K + B1 M1"></label><label>参数与心得<textarea name="body" required maxlength="5000" rows="4" placeholder="光线、快门、光圈、ISO，以及哪里有效 / 下次怎么改…"></textarea></label><button class="primary-button" type="submit">＋ 添加实拍经验</button></form><div class="experience-list">${memory.experiences.length ? memory.experiences.map(e => `<article class="experience-card"><span class="eyebrow">${escape(e.date)}</span><h3>${escape(e.title)}</h3><p>${escape(e.body)}</p><button data-delete-experience="${escape(e.id)}" class="text-button">删除这条</button></article>`).join('') : '<p class="muted">还没有实拍记录。拍完一组，记下一条最有用的发现。</p>'}</div><div class="section-heading"><h2>收藏、备注与验证 <span class="count">${saved.length}</span></h2></div><div class="cards-grid">${saved.length ? saved.map(knowledgeCard).join('') : '<div class="empty-state"><p>在任意知识卡底部，收藏、写备注或标记验证有效。</p><a href="#scenes">去场景速查 ↗</a></div>'}</div>`;
}
function categoryContent(id) {
  const descriptions = { light: '人站对位置，比记住一套参数更有用。', modes: '变化的光用 Av，稳定的光和闪光练习用 M。', exposure: '只记现场最有用的：不糊、曝光正常，再考虑低 ISO。', flash: '环境光一套曝光，闪光照到的人物再单独微调。', wb: '先判断肤色，再修偏色。网上配方不是万能公式。', style: '保留一套基础质感，把现场调整留给曝光和白平衡。', extra: '轻度后期、实拍练习，以及偶尔用到的全家福。' };
  return pageHead(categories[id], descriptions[id] || '') + (id === 'wb' ? wbTools() : '') + (id === 'flash' ? flashDiagram() : '') + `<div class="cards-grid ${id === 'wb' || id === 'flash' ? 'after-tools' : ''}">${guide.articles.filter(c => c.category === id).map(knowledgeCard).join('')}</div>`;
}
function render() {
  nav();
  const route = page();
  let content;
  if (route === 'home') content = home();
  else if (route === 'scenes') content = scenes();
  else if (route === 'rescue') content = rescue();
  else if (route === 'personal') content = personal();
  else if (route === 'search') content = pageHead('搜索现场手册', '参数、问题、场景都可以搜。', 'SEARCH / 全部知识') + '<div id="search-results" aria-live="polite"></div>';
  else if (route === 'detail') {
    const card = cards.find(c => c.id === location.hash.split('/')[1]);
    content = card ? `<a class="back-link" href="#${card.category}">← ${categories[card.category]}</a><div class="detail-layout">${knowledgeCard(card)}</div>` : '<div class="empty-state"><h1>没有找到这张卡片</h1><a href="#home">返回首页</a></div>';
  } else if (categories[route]) content = categoryContent(route);
  else content = '<div class="empty-state"><h1>这个页面不存在</h1><a href="#home">返回首页</a></div>';
  app.innerHTML = searchBox() + content;
  document.title = `${route === 'detail' ? '知识卡片' : categories[route] || '搜索'} · 立里摄影实战指南`;
  if (route === 'search') renderResults();
  if (route === 'wb') { wbSelected.clear(); updateWB(); }
}
function renderResults() {
  const el = document.querySelector('#search-results'); if (!el) return;
  const key = normalize(query.trim());
  const searchKey = key.replace('闪光补偿', '闪光曝光补偿');
  const results = searchKey ? cards.filter(c => normalize(JSON.stringify(c)).includes(searchKey)) : [];
  el.innerHTML = key ? `<p class="result-count">“${escape(query)}” · ${results.length} 条结果</p><div class="cards-grid">${results.map(preview).join('')}</div>${results.length ? '' : '<div class="empty-state"><h2>暂时没有匹配的知识</h2><p>试试“直闪”“M1”“人太黄”或“1/160”。</p><a href="#rescue">先去现场救命模式 ↗</a></div>'}` : '<div class="empty-state"><h2>现在遇到了什么问题？</h2><p>输入场景、参数或偏色问题，即时查找。</p><div class="chips">'+['阴天','直闪','B5G1','M1','f/5.6','人太黄'].map(q => `<button class="chip" data-query="${q}">${q}</button>`).join('')+'</div></div>';
}
function updateWB() {
  const map = { yellow: 'B', blue: 'A', green: 'M', pink: 'G' };
  const directions = [...wbSelected].map(id => map[id]);
  document.querySelectorAll('[data-wb]').forEach(b => { const active = wbSelected.has(b.dataset.wb); b.classList.toggle('active', active); b.setAttribute('aria-pressed', active); });
  document.querySelectorAll('[data-axis]').forEach(el => el.classList.toggle('highlight', directions.includes(el.dataset.axis)));
  document.querySelector('#wb-direction').textContent = directions.length ? directions.join(' + ') : '0 · 先不偏移';
  const explanation = { B: '往蓝小幅去黄', A: '往琥珀小幅加暖', M: '往洋红小幅去绿', G: '往绿小幅去洋红' };
  document.querySelector('#wb-explanation').textContent = directions.length ? directions.map(d => explanation[d]).join('；') + '。从 1 格起步，不是固定配方。' : '点一个偏色问题，可以组合黄蓝轴与绿洋红轴。';
  const point = document.querySelector('#wb-point'); point.style.left = `${50 + (directions.includes('A') ? 25 : directions.includes('B') ? -25 : 0)}%`; point.style.top = `${50 + (directions.includes('M') ? 25 : directions.includes('G') ? -25 : 0)}%`;
}
app.addEventListener('click', event => {
  const target = event.target.closest('button'); if (!target) return;
  if (target.dataset.sceneFilter) { sceneFilter = target.dataset.sceneFilter; render(); }
  if (target.dataset.rescue) { rescueId = target.dataset.rescue; render(); document.querySelector('#rescue-answer').scrollIntoView({ block: 'nearest' }); }
  for (const [attr, key] of [['favorite','favorite'],['verified','verified']]) if (target.dataset[attr]) { const id = target.dataset[attr]; memory.cards[id] ||= {}; memory.cards[id][key] = !memory.cards[id][key]; save(); target.classList.toggle('selected', memory.cards[id][key]); target.setAttribute('aria-pressed', !!memory.cards[id][key]); target.textContent = key === 'favorite' ? memory.cards[id][key] ? '★ 已收藏' : '☆ 收藏' : memory.cards[id][key] ? '✓ 已验证有效' : '✓ 这次验证有效'; }
  if (target.dataset.saveNote) { const id = target.dataset.saveNote; memory.cards[id] ||= {}; memory.cards[id].note = app.querySelector(`[data-note="${id}"]`).value.trim(); if (save()) toast('个人备注已保存'); target.closest('details').querySelector('summary').textContent = memory.cards[id].note ? '✎ 查看备注' : '✎ 添加备注'; }
  if (target.dataset.wb) { const id = target.dataset.wb; const opposite = { yellow:'blue',blue:'yellow',green:'pink',pink:'green' }; if (wbSelected.has(id)) wbSelected.delete(id); else { wbSelected.delete(opposite[id]); wbSelected.add(id); } updateWB(); }
  if (target.id === 'wb-reset') { wbSelected.clear(); updateWB(); }
  if (target.dataset.query) { query = target.dataset.query; document.querySelector('#search-input').value = query; renderResults(); }
  if (target.dataset.deleteExperience) { const removed = memory.experiences.find(e => e.id === target.dataset.deleteExperience); memory.experiences = memory.experiences.filter(e => e.id !== target.dataset.deleteExperience); save(); render(); toast('记录已删除'); if (removed) { const t = document.querySelector('#toast'); const undo = document.createElement('button'); undo.textContent = '撤销'; undo.onclick = () => { memory.experiences.unshift(removed); save(); render(); toast('已恢复'); }; t.append(' ', undo); } }
  if (target.id === 'export-data') { const blob = new Blob([JSON.stringify(memory, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `立里摄影经验-${new Date().toLocaleDateString('sv-SE')}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
});
app.addEventListener('input', event => {
  if (event.target.id === 'search-input') { query = event.target.value; if (page() !== 'search') { location.hash = 'search'; } else renderResults(); }
  if (event.target.id === 'kelvin-slider') { const k = Number(event.target.value); document.querySelector('#kelvin-output').value = `${k} K`; const ratio = (k - 4300) / 1200; document.querySelector('#kelvin-sample').style.background = `linear-gradient(120deg, hsl(${215 - ratio * 183} 30% 78%), hsl(${215 - ratio * 183} 22% 90%))`; }
});
app.addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'search-form') { query = document.querySelector('#search-input').value; if (page() !== 'search') location.hash = 'search'; else renderResults(); }
  if (event.target.id === 'experience-form') { const form = new FormData(event.target); const title = String(form.get('title')).trim(), body = String(form.get('body')).trim(); if (!title || !body) { toast('请填写标题与心得'); return; } memory.experiences.unshift({ id: crypto.randomUUID(), title, body, date: new Date().toLocaleDateString('zh-CN') }); save(); render(); toast(storageFailed ? '当前页面已添加，浏览器无法保存' : '实拍经验已保存'); }
});
app.addEventListener('change', async event => {
  if (event.target.id !== 'import-data' || !event.target.files[0]) return;
  try {
    if (event.target.files[0].size > 2_000_000) throw new Error('备份文件过大');
    const imported = JSON.parse(await event.target.files[0].text());
    if (!imported.cards || typeof imported.cards !== 'object' || Array.isArray(imported.cards) || !Array.isArray(imported.experiences)) throw new Error('备份格式不正确');
    for (const [id, value] of Object.entries(imported.cards)) { if (!cards.some(c => c.id === id) || !value || typeof value !== 'object') continue; memory.cards[id] = { favorite: !!value.favorite, verified: !!value.verified, note: typeof value.note === 'string' ? value.note.slice(0, 10000) : '' }; }
    for (const e of imported.experiences) if (e && typeof e.id === 'string' && typeof e.title === 'string' && typeof e.body === 'string' && !memory.experiences.some(x => x.id === e.id)) memory.experiences.push({ id: e.id, title: e.title.slice(0,100), body: e.body.slice(0,5000), date: String(e.date || '') });
    if (save()) toast('已合并导入备份'); render();
  } catch (error) { toast(`导入失败：${error.message}`); }
});
window.addEventListener('hashchange', () => { const searching = page() === 'search'; render(); if (searching) { const input = document.querySelector('#search-input'); input.focus(); input.setSelectionRange(input.value.length, input.value.length); } else { query = ''; document.querySelector('#search-input').value = ''; window.scrollTo(0, 0); } });
document.addEventListener('keydown', event => { if (event.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); document.querySelector('#search-input')?.focus(); } });
try {
  const response = await fetch('/data/guide.json'); if (!response.ok) throw new Error(`HTTP ${response.status}`); guide = await response.json(); cards = [...guide.scenes, ...guide.rescue, ...guide.articles]; render();
} catch (error) { app.innerHTML = `<div class="empty-state"><h1>手册读取失败</h1><p>请通过本地服务器打开网站，而不是双击 index.html。</p><p>${escape(error.message)}</p><button class="primary-button" onclick="location.reload()">重新加载</button></div>`; }
