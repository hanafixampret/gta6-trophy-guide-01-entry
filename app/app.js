/* Vice Ledger — GTA VI trophy guide & tracker.
   Static, offline, no build step: it fetches its own data files (trophies.json,
   steps.json) from app/, saves progress in localStorage, and never calls the
   network. URL params drive the screenshots: ?view=, ?open=<trophy id>,
   ?demo=1 (a fixed 13-earned set), ?spoiler=on|off, ?focus=guide. */

const STORE_KEY = 'vice-ledger-v1';
const DEMO_EARNED = ['just-like-paradise', 'paradise-lost', 'tits-ass-drug-money',
  'vice-city-baby', 'trust', 'break-the-bank', 'master-of-none', 'stick-fiddler',
  'in-the-beginning', 'lets-go-bowling', 'ten-pin', 'personal-best', 'top-fun'];

let trophies = [];
let steps = { stages: [], missables: [], sources: [], disagreements: [] };
let state = { earned: new Set(), notes: {}, spoiler: true, theme: 'night' };
let selectedId = null;
let filter = 'all';
let gradeFilter = 'all';
let query = '';

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.earned = new Set(parsed.earned || []);
    state.notes = parsed.notes || {};
    state.spoiler = parsed.spoiler !== false;
    state.theme = parsed.theme === 'paper' ? 'paper' : 'night';
  } catch { /* a corrupt save starts fresh */ }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    earned: [...state.earned], notes: state.notes,
    spoiler: state.spoiler, theme: state.theme,
  }));
}

function readParams() {
  const p = new URLSearchParams(location.search);
  const view = p.get('view');
  if (view && ['checklist', 'roadmap', 'missables', 'planner', 'sources'].includes(view)) {
    setView(view, false);
  }
  if (p.get('demo') === '1') DEMO_EARNED.forEach((id) => state.earned.add(id));
  if (p.get('spoiler') === 'off') state.spoiler = false;
  if (p.get('spoiler') === 'on') state.spoiler = true;
  const open = p.get('open');
  if (open && trophies.some((t) => t.id === open)) selectedId = open;
  if (p.get('focus') === 'guide') document.querySelector('.layout').classList.add('focus-guide');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function trophyById(id) { return trophies.find((t) => t.id === id); }

function isStory(t) { return t.kind === 'story'; }

function isHiddenBySpoiler(t) {
  return state.spoiler && isStory(t) && !state.earned.has(t.id);
}

function gradeLabel(t) {
  return t.grade[0].toUpperCase() + t.grade.slice(1);
}

function medalLetter(t) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[t.grade] || '?';
}

function updateProgress() {
  const earned = trophies.filter((t) => state.earned.has(t.id));
  const pct = trophies.length ? Math.round((earned.length / trophies.length) * 100) : 0;
  document.getElementById('earned-count').textContent = `${earned.length} / ${trophies.length}`;
  const byGrade = (g) => earned.filter((t) => t.grade === g).length;
  document.getElementById('grade-counts').textContent =
    `${byGrade('gold')} gold · ${byGrade('silver')} silver · ${byGrade('bronze')} bronze`;
  const ring = document.getElementById('ring');
  ring.style.setProperty('--p', pct);
  ring.innerHTML = `<span>${pct}%</span>`;
  document.getElementById('missable-badge').textContent =
    trophies.filter((t) => t.missable && !state.earned.has(t.id)).length;
}

function filteredTrophies() {
  const q = query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (filter === 'story' && !isStory(t)) return false;
    if (filter === 'missable' && !t.missable) return false;
    if (filter === 'collectible' && t.kind !== 'collectible') return false;
    if (filter === 'activity' && t.kind !== 'activity') return false;
    if (filter === 'unearned' && state.earned.has(t.id)) return false;
    if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function trophyRow(t) {
  const earned = state.earned.has(t.id);
  const hidden = isHiddenBySpoiler(t);
  const name = hidden ? 'Story trophy — hidden' : escapeHtml(t.name);
  const desc = hidden
    ? '<span class="spoiler-note">Hidden until earned — turn Spoilers off to peek.</span>'
    : escapeHtml(t.description);
  const tags = [`<span class="tag">${gradeLabel(t)}</span>`, `<span class="tag">${t.kind}</span>`];
  if (t.missable) tags.push('<span class="tag miss">Missable</span>');
  if (t.count) tags.push(`<span class="tag">×${t.count}</span>`);
  return `<article class="trophy${earned ? ' earned' : ''}${selectedId === t.id ? ' selected' : ''}" data-id="${t.id}" tabindex="0">
    <span class="medal ${t.grade}" title="${gradeLabel(t)}">${medalLetter(t)}</span>
    <div><h3>${name}${t.missable ? ' <span class="miss-flag">MISSABLE</span>' : ''}</h3>
    <p>${desc}</p><div class="tags">${tags.join('')}</div></div>
    <button class="check" data-check="${t.id}" aria-checked="${earned}" aria-label="Mark ${escapeHtml(t.name)} earned">${earned ? '✓' : ''}</button>
  </article>`;
}

function renderChecklist() {
  const list = filteredTrophies();
  document.getElementById('toolbar').style.display = '';
  document.getElementById('view').innerHTML = list.length
    ? list.map(trophyRow).join('')
    : '<div class="callout"><h3>Nothing matches</h3><p>Loosen the filters or clear the search.</p></div>';
  bindRows();
}

function bindRows() {
  document.querySelectorAll('.trophy').forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('[data-check]')) return;
      openGuide(row.dataset.id);
    });
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openGuide(row.dataset.id);
    });
  });
  document.querySelectorAll('[data-check]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleEarned(btn.dataset.check);
    });
  });
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveState();
  updateProgress();
  renderCurrentView();
  if (selectedId === id) openGuide(id);
}

function openGuide(id) {
  selectedId = id;
  const t = trophyById(id);
  const detail = document.getElementById('detail');
  if (!t) { detail.innerHTML = '<p class="detail-empty">Pick a trophy to see its guide, its sources, and your notes.</p>'; return; }
  const earned = state.earned.has(t.id);
  const hidden = isHiddenBySpoiler(t);
  const note = state.notes[t.id] || '';
  detail.innerHTML = `
    <h2>${hidden ? 'Story trophy — hidden' : escapeHtml(t.name)}</h2>
    <p class="desc">${hidden ? 'Its name and description stay hidden until you earn it (spoiler setting).' : escapeHtml(t.description)}</p>
    <dl class="kv">
      <dt>Grade</dt><dd>${gradeLabel(t)}${t.count ? ` · PSN tracks ×${t.count}` : ''}</dd>
      <dt>Kind</dt><dd>${t.kind}${t.missable ? ' · <strong style="color:var(--danger)">Missable</strong>' : ''}</dd>
      <dt>Roadmap</dt><dd>Stage ${t.stage} — ${escapeHtml(steps.stages[t.stage - 1]?.title || '')}</dd>
    </dl>
    <h4>Guide</h4>
    <p>${escapeHtml(t.guide)}</p>
    ${t.missable ? '<p><strong>Missable:</strong> see the Missables tab for why, and do it while the story is live.</p>' : ''}
    <p class="sources"><strong>Sources:</strong> ${escapeHtml(t.src)}<br>
    Guides are our own words, from the official description — not yet checked in-game.</p>
    <h4>Your notes</h4>
    <textarea id="note-box" placeholder="Where exactly? Which mission? Your own reminder…" aria-label="Notes for this trophy">${escapeHtml(note)}</textarea>
    <button class="earn-btn${earned ? ' earned' : ''}" id="earn-btn">${earned ? '✓ Earned — click to unmark' : 'Mark as earned'}</button>`;
  document.getElementById('earn-btn').addEventListener('click', () => toggleEarned(t.id));
  document.getElementById('note-box').addEventListener('input', (e) => {
    state.notes[t.id] = e.target.value;
    saveState();
  });
  document.querySelectorAll('.trophy').forEach((row) => {
    row.classList.toggle('selected', row.dataset.id === id);
  });
}

function renderRoadmap() {
  document.getElementById('toolbar').style.display = 'none';
  document.getElementById('view').innerHTML = steps.stages.map((s) => {
    const inStage = trophies.filter((t) => t.stage === s.n);
    const done = inStage.filter((t) => state.earned.has(t.id)).length;
    const pct = inStage.length ? Math.round((done / inStage.length) * 100) : 0;
    return `<section class="stage">
      <h2>Stage ${s.n} — ${escapeHtml(s.title)} <span class="stage-count">${done}/${inStage.length} earned</span></h2>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <p>${escapeHtml(s.blurb)}</p>
      <p class="tip">${escapeHtml(s.tip)}</p>
      <ul class="stage-trophies">${inStage.map((t) =>
        `<li class="${state.earned.has(t.id) ? 'done' : ''}">${escapeHtml(t.name)} — ${gradeLabel(t)}${t.missable ? ' · Missable' : ''}</li>`).join('')}</ul>
    </section>`;
  }).join('');
}

function renderMissables() {
  document.getElementById('toolbar').style.display = 'none';
  const list = steps.missables.map((m) => trophyById(m.id)).filter(Boolean);
  document.getElementById('view').innerHTML =
    `<div class="callout"><h3>6 missables — do them during the story</h3>
     <p>These need a partner beside you or a one-shot story moment. The rest of the list can be cleaned up in free roam after the story. If missions turn out to be replayable, a replay fixes a miss — that is not confirmed in-game yet.</p></div>`
    + list.map((t) => {
      const why = steps.missables.find((m) => m.id === t.id)?.why || '';
      return `<article class="trophy${state.earned.has(t.id) ? ' earned' : ''}" data-id="${t.id}" tabindex="0">
        <span class="medal ${t.grade}">${medalLetter(t)}</span>
        <div><h3>${escapeHtml(t.name)} <span class="miss-flag">MISSABLE</span></h3>
        <p>${escapeHtml(t.description)}</p><p><strong>Why:</strong> ${escapeHtml(why)}</p></div>
        <button class="check" data-check="${t.id}" aria-checked="${state.earned.has(t.id)}" aria-label="Mark earned">${state.earned.has(t.id) ? '✓' : ''}</button>
      </article>`;
    }).join('');
  bindRows();
}

function nextUpQueue() {
  // Missables you have not earned yet, in story order, come first; then the
  // earliest roadmap stage with the most left; then the nearest big counts.
  const out = [];
  const unEarned = (t) => !state.earned.has(t.id);
  steps.missables.map((m) => trophyById(m.id)).filter((t) => t && unEarned(t))
    .forEach((t) => out.push({ t, why: 'Missable — do it while the story is live.' }));
  const byStage = [1, 2, 3, 4, 5].flatMap((n) =>
    trophies.filter((t) => t.stage === n && unEarned(t) && !t.missable));
  byStage.slice(0, 6).forEach((t) => out.push({
    t, why: `Stage ${t.stage} — ${steps.stages[t.stage - 1]?.title || ''}.`,
  }));
  return out.slice(0, 8);
}

function renderPlanner() {
  document.getElementById('toolbar').style.display = 'none';
  const queue = nextUpQueue();
  document.getElementById('view').innerHTML =
    `<div class="callout"><h3>Next up — in the order to do them</h3>
     <p>Missables first, then the earliest unfinished roadmap stage. The queue updates as you tick trophies off.</p></div>
    <ul class="next-list" style="padding: 0 16px 12px">${queue.map(({ t, why }) =>
      `<li data-id="${t.id}" tabindex="0"><span class="medal ${t.grade}">${medalLetter(t)}</span>
       <span><strong>${escapeHtml(t.name)}</strong> — ${gradeLabel(t)}<br><span class="why">${escapeHtml(why)}</span></span></li>`).join('')}</ul>`;
  document.querySelectorAll('.next-list li').forEach((li) => {
    li.addEventListener('click', () => { setView('checklist', false); openGuide(li.dataset.id); });
  });
}

function renderSources() {
  document.getElementById('toolbar').style.display = 'none';
  document.getElementById('view').innerHTML =
    `<div class="callout"><h3>Where every fact comes from</h3>
     <p>Names, descriptions and grades are PlayStation's own, as Exophase and PSNProfiles list them. Every guide is our own words, built from the official description of its trophy — not copied from another guide. Where a guide says how to do something the description does not spell out, it is our advice, and it says so: the game is a day old and nothing here is checked in-game yet.</p></div>`
    + steps.sources.map((s) => `<div class="source-item" style="padding: 10px 16px">
        <strong>${escapeHtml(s.name)}</strong><br>${escapeHtml(s.gives)}
        ${s.url ? `<br><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.url)}</a>` : ''}</div>`).join('')
    + `<div class="callout"><h3>Where sources disagree — or where we are guessing</h3>`
    + steps.disagreements.map((d) => `<p><strong>${escapeHtml(d.title)}</strong><br>${escapeHtml(d.text)}</p>`).join('') + '</div>';
}

let currentView = 'checklist';

function renderCurrentView() {
  if (currentView === 'checklist') renderChecklist();
  else if (currentView === 'roadmap') renderRoadmap();
  else if (currentView === 'missables') renderMissables();
  else if (currentView === 'planner') renderPlanner();
  else if (currentView === 'sources') renderSources();
  updateProgress();
}

function setView(view, save = true) {
  currentView = view;
  document.querySelectorAll('#tabs button').forEach((b) => {
    const on = b.dataset.view === view;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on);
  });
  renderCurrentView();
  if (save) saveState();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({
    app: 'vice-ledger', version: 1,
    earned: [...state.earned].sort(), notes: state.notes,
    exported_at: new Date().toISOString(),
  }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vice-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const ids = new Set(trophies.map((t) => t.id));
      state.earned = new Set((parsed.earned || []).filter((id) => ids.has(id)));
      state.notes = parsed.notes || {};
      saveState();
      renderCurrentView();
      if (selectedId) openGuide(selectedId);
    } catch { alert('That file is not a Vice Ledger export.'); }
  };
  reader.readAsText(file);
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
  document.getElementById('theme-btn').textContent = state.theme === 'night' ? 'Paper' : 'Night';
  const sb = document.getElementById('spoiler-btn');
  sb.classList.toggle('on', state.spoiler);
  sb.textContent = state.spoiler ? 'Spoilers: hidden' : 'Spoilers: shown';
  sb.setAttribute('aria-pressed', state.spoiler);
}

async function init() {
  loadState();
  const [tRes, sRes] = await Promise.all([
    fetch('data/trophies.json'), fetch('data/steps.json'),
  ]);
  const tData = await tRes.json();
  trophies = tData.trophies || tData;
  steps = await sRes.json();
  applyTheme();
  readParams();
  document.querySelectorAll('#tabs button').forEach((b) => {
    b.addEventListener('click', () => setView(b.dataset.view));
  });
  document.querySelectorAll('#filter-chips .chip').forEach((c) => {
    c.addEventListener('click', () => {
      filter = c.dataset.filter;
      document.querySelectorAll('#filter-chips .chip').forEach((x) => x.classList.toggle('active', x === c));
      renderChecklist();
    });
  });
  document.getElementById('search').addEventListener('input', (e) => {
    query = e.target.value;
    renderChecklist();
  });
  document.getElementById('grade-filter').addEventListener('change', (e) => {
    gradeFilter = e.target.value;
    renderChecklist();
  });
  document.getElementById('theme-btn').addEventListener('click', () => {
    state.theme = state.theme === 'night' ? 'paper' : 'night';
    saveState();
    applyTheme();
  });
  document.getElementById('spoiler-btn').addEventListener('click', () => {
    state.spoiler = !state.spoiler;
    saveState();
    applyTheme();
    renderCurrentView();
    if (selectedId) openGuide(selectedId);
  });
  document.getElementById('export-btn').addEventListener('click', exportProgress);
  document.getElementById('import-file').addEventListener('change', (e) => {
    if (e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  renderCurrentView();
  if (selectedId) openGuide(selectedId);
}

init();
