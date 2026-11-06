// 离散之间 · 学习站前端
// 数据：lessons（data.js，章信息）、sections（sections.js，小节与页码）、CONTENT（content.js，正文/练习/页码记录）
'use strict';
const C = typeof CONTENT === 'undefined' ? {} : CONTENT;
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');

// ---------- 状态（仅保存在本浏览器） ----------
function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const store = {
  read: load('discrete-read-sections', []),
  answers: load('discrete-v2-answers', {}),
  last: load('discrete-v2-last', null),
};
function persist() {
  try {
    localStorage.setItem('discrete-read-sections', JSON.stringify(store.read));
    localStorage.setItem('discrete-v2-answers', JSON.stringify(store.answers));
    localStorage.setItem('discrete-v2-last', JSON.stringify(store.last));
  } catch { }
  $('#wc').textContent = wrongKeys().length;
}
const wrongKeys = () => Object.keys(store.answers).filter(k => !store.answers[k].correct && quizItem(k));
const isRead = k => store.read.includes(k);

// ---------- 数据工具 ----------
const chapterSections = id => sections.filter(s => s.chapter === id);
const secTitle = s => `${s.key} ${s.title}`;
const plain = html => html.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
function topicsOf(key) {
  const html = C[key]?.html || '';
  return [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map(m => plain(m[1].replace(/<span class="pg">[\s\S]*?<\/span>/, '')).trim());
}
function quizItem(k) { const [key, i] = k.split('#'); return C[key]?.quiz?.[Number(i)] }

// 搜索索引：按 小节 → h3 知识点 切块
let INDEX = null;
function buildIndex() {
  INDEX = [];
  for (const s of sections) {
    const html = C[s.key]?.html || '';
    const parts = html.split(/(?=<h3[\s>])/);
    let t = -1;
    for (const part of parts) {
      const isTopic = /^<h3[\s>]/.test(part);
      if (isTopic) t++;
      const title = isTopic ? plain(part.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1].replace(/<span class="pg">[\s\S]*?<\/span>/, '')).trim() : '';
      INDEX.push({ key: s.key, topic: isTopic ? t : null, title, text: plain(part) });
    }
    INDEX.push({ key: s.key, topic: null, title: '', text: s.key + ' ' + s.title + ' ' + lessons[s.chapter].title });
  }
}

// ---------- 侧边目录 ----------
function nav() {
  const h = location.hash;
  $('#nav').innerHTML = '<a href="#home">⌂ 学习概览</a><a href="#search">⌕ 全文搜索</a>' +
    lessons.map(l => {
      const ss = chapterSections(l.id);
      const open = ss.some(s => h.startsWith('#s/' + s.key + '/') || h === '#s/' + s.key) || h === '#c/' + l.id;
      const n = ss.filter(s => isRead(s.key)).length;
      return `<details${open ? ' open' : ''}><summary><span>${pad(l.id + 1)}　${esc(l.title)}</span><small>${n}/${ss.length}</small></summary>` +
        `<a class="${h === '#c/' + l.id ? 'active' : ''}" href="#c/${l.id}">本章目录与练习</a>` +
        ss.map(s => `<a class="${h === '#s/' + s.key || h.startsWith('#s/' + s.key + '/') ? 'active' : ''}" href="#s/${s.key}">${esc(secTitle(s))}${isRead(s.key) ? ' <b class="ok">✓</b>' : ''}</a>`).join('') +
        '</details>';
    }).join('');
}

// ---------- 页面：首页 ----------
function home() {
  crumb('学习概览');
  const total = sections.length, read = store.read.filter(k => sections.some(s => s.key === k)).length;
  const answered = Object.keys(store.answers).filter(quizItem), right = answered.filter(k => store.answers[k].correct).length;
  const quizTotal = sections.reduce((a, s) => a + (C[s.key]?.quiz?.length || 0), 0);
  const next = (store.last && sections.find(s => s.key === store.last)) || sections.find(s => !isRead(s.key)) || sections[0];
  const pagesRec = sections.flatMap(s => C[s.key]?.pages || []);
  const stat = st => pagesRec.filter(r => r.status === st).length;
  app.innerHTML = `<section class="hero"><div><span class="eyebrow">A LITTLE LOGIC, EVERY DAY</span>
  <h1>把离散的知识，<br>连成清晰的思路。</h1>
  <p>从一个命题，到一张图，再到抽象的代数结构。按你的 272 页手写笔记逐页整理成文字、公式与图形，每节配有练习。</p>
  <div class="actions"><a class="button primary" href="#s/${next.key}">${store.last ? '继续阅读' : '开始学习'} · ${esc(secTitle(next))} →</a><a class="button" href="#search">全文搜索</a></div></div>
  <div class="art">∀ → ∞</div></section>
  <div class="stats"><div><strong>${read}/${total}</strong><span>已读小节</span></div><div><strong>${answered.length}/${quizTotal}</strong><span>已做练习</span></div>
  <div><strong>${answered.length ? Math.round(right / answered.length * 100) + '%' : '—'}</strong><span>正确率</span></div><div><strong>${wrongKeys().length}</strong><span>待复习错题</span></div></div>
  <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${read}" aria-label="阅读进度"><span style="width:${read / total * 100}%"></span></div>
  <section><h2>课程目录 <small class="tag">17 章 · 73 小节 · 按笔记顺序</small></h2><div class="grid">${lessons.map(l => {
    const ss = chapterSections(l.id), n = ss.filter(s => isRead(s.key)).length;
    return `<a class="card" href="#c/${l.id}"><span class="num">CHAPTER ${pad(l.id + 1)}　${n === ss.length ? '✓ 已读完' : n ? n + '/' + ss.length + ' 已读' : ''}</span><h3>${esc(l.title)}</h3><p>${ss.map(s => esc(s.title)).join(' · ')}</p><span class="tag">${esc(l.group)} · ${ss.length} 小节 · 原笔记第 ${l.start}–${l.end} 页</span></a>`
  }).join('')}</div></section>
  <section class="box"><h3>内容说明</h3>
  <p>正文依据你的手写笔记逐页整理：定义、定理、证明、例题、图形和边注都转成网页文字、公式与 SVG 图。整理者自己补充的讲解单独标为“补充讲解”；笔记中的笔误保留原式并给出“校订说明”；确实无法辨认的地方标为“待核对”，并写明页码和位置。每节末尾可以折叠展开原页，用来对照核对。</p>
  <p>页码处理记录：已转写 ${stat('transcribed')} 页，含待核对项 ${stat('partial')} 页，重复页 ${stat('duplicate')} 页，空白页 ${stat('blank')} 页，共 ${pagesRec.length}/272 页。<a href="#pages">查看逐页清单 →</a></p>
  <p>指定教材为耿素云、屈婉玲等编著的《离散数学》第七版。本站没有使用该版教材全文，所以章节号沿用笔记本身，也不标注教材页码。</p>
  <p class="note">阅读进度和练习记录只保存在当前浏览器里。</p></section>`;
}

// ---------- 页面：章 ----------
function chapter(id) {
  const l = lessons[id]; if (!l) return home();
  crumb(l.title);
  const ss = chapterSections(id);
  app.innerHTML = `<article class="lesson"><span class="eyebrow">CHAPTER ${pad(id + 1)} / ${esc(l.group)}</span><h1>${esc(l.title)}</h1>
  <p>原笔记第 ${l.start}–${l.end} 页，共 ${ss.length} 个小节。</p>
  <section class="box"><h2>本章小节与知识点</h2><div class="section-list">${ss.map(s => {
    const tp = topicsOf(s.key);
    return `<div class="sec-item"><a href="#s/${s.key}"><b>${esc(secTitle(s))}${isRead(s.key) ? ' ✓' : ''}</b><span>第 ${s.start}–${s.end} 页 · ${C[s.key]?.quiz?.length || 0} 题 →</span></a>${tp.length ? `<ol>${tp.map((t, i) => `<li><a href="#s/${s.key}/${i}">${esc(t)}</a></li>`).join('')}</ol>` : ''}</div>`
  }).join('')}</div></section>
  <section id="practice"><h2>本章练习</h2><p class="note">按小节分组，可直接作答，也可进入小节阅读后再做。</p>
  ${ss.map(s => (C[s.key]?.quiz || []).length ? `<h3 class="quiz-group">${esc(secTitle(s))}</h3>` + C[s.key].quiz.map((q, i) => question(s.key, i)).join('') : '').join('')}</section>
  <div class="actions">${id ? `<a class="button" href="#c/${id - 1}">← 上一章</a>` : ''}${id < lessons.length - 1 ? `<a class="button primary" href="#c/${id + 1}">下一章 →</a>` : ''}</div></article>`;
  typeset();
}

// ---------- 页面：小节 ----------
function section(key, topic) {
  const s = sections.find(x => x.key === key); if (!s) return home();
  const i = sections.indexOf(s), l = lessons[s.chapter], c = C[key];
  crumb(`${l.title} / ${s.key}`);
  store.last = key; persist();
  const pages = Array.from({ length: s.end - s.start + 1 }, (_, j) => s.start + j);
  const rec = n => (c?.pages || []).find(r => r.page === n);
  const label = { transcribed: '已转写', duplicate: '重复页', blank: '空白页', partial: '含待核对项' };
  app.innerHTML = `<article class="fullnotes">
  <a href="#c/${s.chapter}">← 第 ${s.chapter + 1} 章 ${esc(l.title)}</a>
  <span class="eyebrow section-kicker">SECTION ${esc(s.key)}</span><h1>${esc(secTitle(s))}</h1>
  <p class="note">原笔记第 ${s.start}–${s.end} 页</p>
  <nav class="local-toc" aria-label="本节知识点"></nav>
  <section class="transcript">${c ? c.html : '<p class="unclear">本小节正文文件缺失，请运行 scripts/build.py 检查。</p>'}</section>
  ${c?.quiz?.length ? `<section id="practice" class="practice"><h2>本节练习 <small class="tag">${c.quiz.length} 题 · 选择与填空</small></h2>${c.quiz.map((q, j) => question(key, j)).join('')}</section>` : ''}
  <details id="original-pages" class="box"><summary>原页对照 · 第 ${s.start}–${s.end} 页</summary>
  <p class="note">原页图片仅用于核对正文。点击图片可打开高清原图。</p>
  <div class="page-records">${pages.map(n => { const r = rec(n); return `<a href="#note-page-${n}" data-page="${n}" class="rec ${r?.status || 'none'}">p.${n} ${r ? label[r.status] || r.status : '无记录'}</a>` }).join('')}</div>
  <button id="zoom-pages" type="button">放大阅读</button>
  <div class="pages-wrap"></div></details>
  <div class="actions sec-nav">${i ? `<a class="button" href="#s/${sections[i - 1].key}">← ${esc(secTitle(sections[i - 1]))}</a>` : ''}
  <button id="read-done" type="button" class="${isRead(key) ? '' : 'primary'}">${isRead(key) ? '本节已读 ✓' : '标记本节已读'}</button>
  ${i < sections.length - 1 ? `<a class="button primary" href="#s/${sections[i + 1].key}">${esc(secTitle(sections[i + 1]))} →</a>` : ''}</div></article>`;

  // 知识点目录
  const hs = [...document.querySelectorAll('.transcript h3')], toc = $('.local-toc');
  if (hs.length) toc.innerHTML = '<strong>本节知识点</strong>' + hs.map((h, j) => { h.id = 'topic-' + j; return `<a href="#s/${key}/${j}">${esc(h.textContent)}</a>` }).join('') + (c?.quiz?.length ? '<a class="toc-quiz" href="#s/' + key + '/quiz">练习</a>' : '');
  // 表格、长公式容器
  document.querySelectorAll('.transcript table').forEach(t => { if (!t.parentElement.classList.contains('tbl')) { const w = document.createElement('div'); w.className = 'tbl'; t.replaceWith(w); w.appendChild(t) } });
  // 原页懒加载：展开时才插入图片
  const det = $('#original-pages');
  const fill = () => { const w = $('.pages-wrap'); if (w.childElementCount) return; w.innerHTML = pages.map(n => { const src = 'pages/' + String(n).padStart(3, '0') + '.jpg'; const r = rec(n); return `<figure class="note-page" id="note-page-${n}"><figcaption>原笔记第 ${n} 页${r ? ' · ' + esc(label[r.status] || r.status) + (r.note ? '：' + esc(r.note) : '') : ''}</figcaption><a href="${src}" target="_blank" rel="noopener"><img src="${src}" loading="lazy" alt="${esc(s.title)}，原笔记第${n}页手写原图"></a></figure>` }).join('') };
  det.addEventListener('toggle', () => det.open && fill());
  document.querySelectorAll('.page-records a').forEach(a => a.onclick = e => { e.preventDefault(); det.open = true; fill(); document.getElementById('note-page-' + a.dataset.page).scrollIntoView({ behavior: 'smooth' }) });
  $('#zoom-pages').onclick = e => { const big = $('.fullnotes').classList.toggle('zoomed'); e.target.textContent = big ? '适应宽度' : '放大阅读' };
  $('#read-done').onclick = e => { if (!isRead(key)) store.read.push(key); else store.read = store.read.filter(k => k !== key); persist(); nav(); e.target.textContent = isRead(key) ? '本节已读 ✓' : '标记本节已读'; e.target.classList.toggle('primary', !isRead(key)) };

  typeset().then(() => {
    if (topic === 'quiz') $('#practice')?.scrollIntoView();
    else if (topic != null) document.getElementById('topic-' + topic)?.scrollIntoView();
    if (searchTerm) highlight($('.transcript'), searchTerm);
  });
}

// ---------- 练习 ----------
function question(key, i) {
  const q = C[key].quiz[i], id = key + '#' + i, prev = store.answers[id];
  const name = 'q-' + key.replace('.', '_') + '-' + i;
  return `<div class="box quiz"><span class="tag">${q.type === 'choice' ? '单项选择' : '填空题'} · ${esc(key)} 第 ${i + 1} 题${prev ? (prev.correct ? ' · ✓ 已答对' : ' · ✗ 上次答错') : ''}</span>
  <div class="q">${esc(q.q)}</div><form data-id="${id}">${q.type === 'choice'
      ? q.options.map((o, j) => `<label class="option"><input type="radio" name="${name}" value="${j}" required> <b>${String.fromCharCode(65 + j)}.</b> <span>${esc(o)}</span></label>`).join('')
      : `<label class="fill">你的答案 <input name="${name}" autocomplete="off" required></label>`}
  <div class="actions"><button class="primary" type="submit">提交</button><button type="button" data-explain="${id}">看答案与解析</button></div>
  <div class="feedback" aria-live="polite"></div></form></div>`;
}
const norm = s => String(s).normalize('NFKC').replace(/\\[()[\]]/g, '').replace(/[\s$]/g, '').replace(/，/g, ',').toLowerCase();
function showExplain(form, prefix) {
  const q = quizItem(form.dataset.id), fb = form.querySelector('.feedback');
  const ans = q.type === 'choice' ? String.fromCharCode(65 + q.answer) + '. ' + esc(q.options[q.answer]) : q.answer.map(esc).join(' 或 ');
  fb.innerHTML = `${prefix || ''}<div><b>答案：</b>${ans}</div><div><b>解析：</b>${esc(q.why)}</div>`;
  typeset(fb);
}
app.addEventListener('submit', e => {
  const form = e.target.closest('form[data-id]'); if (!form) return;
  e.preventDefault();
  const q = quizItem(form.dataset.id), v = new FormData(form).values().next().value ?? '';
  const correct = q.type === 'choice' ? Number(v) === q.answer : q.answer.some(a => norm(a) === norm(v));
  store.answers[form.dataset.id] = { correct, value: v, t: Date.now() }; persist();
  form.querySelector('.feedback').className = 'feedback ' + (correct ? 'correct' : 'incorrect');
  showExplain(form, correct ? '<div>✓ 回答正确。</div>' : '<div>✗ 还不对，看看解析。</div>');
});
app.addEventListener('click', e => { const b = e.target.closest('[data-explain]'); if (b) showExplain(b.closest('form')) });

function wrong() {
  crumb('错题回顾');
  const ks = wrongKeys();
  app.innerHTML = `<section class="lesson"><h1>错题回顾</h1><p>重新答对后，题目会从这里移除（刷新页面后生效）。</p>${ks.length ? ks.map(k => { const [key, i] = k.split('#'); const s = sections.find(x => x.key === key); return `<p class="note"><a href="#s/${key}">${esc(secTitle(s))}</a></p>` + question(key, Number(i)) }).join('') : '<div class="box">目前没有错题。</div>'}</section>`;
  typeset();
}

// ---------- 搜索 ----------
let searchTerm = '';
function search() {
  crumb('全文搜索');
  app.innerHTML = `<section class="lesson"><h1>全文搜索</h1><label for="q" class="sr">搜索正文</label><input id="q" type="search" placeholder="输入关键词，如：哈斯图、欧拉公式、拉格朗日定理" value="${esc(searchTerm)}"><div id="results" aria-live="polite"></div></section>`;
  const input = $('#q'); input.focus();
  const run = () => {
    searchTerm = input.value.trim();
    if (!INDEX) buildIndex();
    const t = searchTerm.toLowerCase();
    if (!t) { $('#results').innerHTML = '<p class="note">可搜索全部小节的正文、公式源码、例题与练习之外的所有文字。</p>'; return }
    const hits = INDEX.filter(x => x.text.toLowerCase().includes(t)), seen = new Set();
    const uniq = hits.filter(x => { const k = x.key + '/' + x.topic; if (seen.has(k)) return false; seen.add(k); return true });
    $('#results').innerHTML = `<p class="note">共 ${uniq.length} 处，涉及 ${new Set(uniq.map(x => x.key)).size} 个小节</p>` + uniq.slice(0, 200).map(x => {
      const s = sections.find(y => y.key === x.key), p = x.text.toLowerCase().indexOf(t);
      const snip = esc(x.text.slice(Math.max(0, p - 40), p)) + '<mark>' + esc(x.text.substr(p, t.length)) + '</mark>' + esc(x.text.slice(p + t.length, p + t.length + 60));
      return `<a class="hit" href="#s/${x.key}${x.topic != null ? '/' + x.topic : ''}"><b>${esc(secTitle(s))}${x.title ? ' › ' + esc(x.title) : ''}</b><span>…${snip}…</span></a>`;
    }).join('');
  };
  input.oninput = run; run();
}
function highlight(root, term) {
  const t = term.toLowerCase(), walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('mjx-container,svg,script') ? 2 : n.nodeValue.toLowerCase().includes(t) ? 1 : 2 });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.slice(0, 100).forEach(n => { const p = n.nodeValue.toLowerCase().indexOf(t), m = document.createElement('mark'); const r = n.splitText(p); r.splitText(term.length); m.textContent = r.nodeValue; r.replaceWith(m) });
}

// ---------- 逐页处理清单 ----------
function pageList() {
  crumb('逐页处理清单');
  const label = { transcribed: '已转写', duplicate: '重复页', blank: '空白页', partial: '含待核对项' };
  const rows = sections.flatMap(s => Array.from({ length: s.end - s.start + 1 }, (_, j) => { const n = s.start + j, r = (C[s.key]?.pages || []).find(x => x.page === n); return `<tr class="${r?.status || 'none'}"><td>${n}</td><td><a href="#s/${s.key}">${esc(s.key)}</a></td><td>${r ? label[r.status] || esc(r.status) : '无记录'}</td><td class="l">${esc(r?.note || '')}</td></tr>` }));
  app.innerHTML = `<section class="lesson"><h1>逐页处理清单</h1><p>272 页原笔记每页的处理状态。“含待核对项”表示该页有个别字迹无法确认，正文中用“待核对”框标出了具体位置。</p><div class="tbl"><table><thead><tr><th>页</th><th>小节</th><th>状态</th><th>说明</th></tr></thead><tbody>${rows.join('')}</tbody></table></div></section>`;
}

// ---------- 路由 ----------
function crumb(t) { $('#crumb').textContent = t; document.title = t + ' · 离散之间' }
// MathJax 以 defer 加载；未就绪时等待 mathjax-ready 事件后再排版
function typeset(el) {
  const run = () => MathJax.typesetPromise([el || app]).catch(() => { });
  if (window.__mjReady && window.MathJax?.typesetPromise) return run();
  return new Promise(r => document.addEventListener('mathjax-ready', () => run().then(r), { once: true }));
}
function route() {
  const h = decodeURIComponent(location.hash);
  // 兼容旧链接
  if (h.startsWith('#section-')) return void (location.hash = '#s/' + h.slice(9));
  if (h.startsWith('#lesson-')) return void (location.hash = '#c/' + h.slice(8));
  document.body.classList.remove('nav-open');
  nav();
  let m;
  if ((m = h.match(/^#s\/([^/]+)(?:\/(\w+))?$/))) section(m[1], m[2] == null ? null : m[2] === 'quiz' ? 'quiz' : Number(m[2]));
  else { searchTerm = h === '#search' ? searchTerm : ''; if ((m = h.match(/^#c\/(\d+)$/))) chapter(Number(m[1])); else if (h === '#search') search(); else if (h === '#wrong') wrong(); else if (h === '#pages') pageList(); else home() }
  if (!(m && m[2] != null)) window.scrollTo(0, 0);
}
$('#wrong').onclick = () => location.hash = 'wrong';
$('#menu').onclick = () => document.body.classList.toggle('nav-open');
$('#side-search').addEventListener('keydown', e => { if (e.key === 'Enter') { searchTerm = e.target.value.trim(); location.hash === '#search' ? search() : location.hash = 'search' } });
window.addEventListener('hashchange', route);
persist(); route();
