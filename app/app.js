// Leonida Platinum — checklist, roadmap, missables and guides for the 55
// GTA VI PlayStation 5 trophies. No libraries, no network at run time: the
// only request the app makes is a same-folder fetch of data/trophies.json.
// Progress, notes and counters live in localStorage; export/import move them
// as one JSON file. Spoiler mode hides secret trophies until they are earned.

const STORAGE_KEY = 'leonida-platinum-v1';
const DATA_URL = 'data/trophies.json';
const TOTAL_POINTS = 1350;

const KIND_LABELS = {
  all: 'All kinds',
  story: 'Story',
  missable: 'Missable',
  collectible: 'Collectibles',
  activity: 'Activities',
  side: 'Side strands',
  money: 'Money',
  online: 'Online',
};

const state = {
  earned: new Set(),
  notes: {},
  counts: {},
  spoilers: false,
  view: 'checklist',
  kind: 'all',
  grade: 'all',
  status: 'all',
  sort: 'default',
  query: '',
  openId: null,
};

let trophies = [];
let dataMeta = {};

const $ = (id) => document.getElementById(id);
const viewEl = $('view');
const detailEl = $('detail');

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    state.earned = new Set(Array.isArray(saved.earned) ? saved.earned : []);
    state.notes = saved.notes && typeof saved.notes === 'object' ? saved.notes : {};
    state.counts = saved.counts && typeof saved.counts === 'object' ? saved.counts : {};
    state.spoilers = saved.spoilers === true;
  } catch {
    state.earned = new Set();
    state.notes = {};
    state.counts = {};
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    app: 'leonida-platinum',
    version: 1,
    earned: [...state.earned],
    notes: state.notes,
    counts: state.counts,
    spoilers: state.spoilers,
  }));
  $('saveNote').textContent = 'Saved in this browser just now.';
}

function trophyById(id) {
  return trophies.find((t) => t.id === id);
}

function isSecret(t) {
  return t.secret === true;
}

function isHiddenFromReader(t) {
  return state.spoilers && isSecret(t) && !state.earned.has(t.id);
}

function kindMatches(t) {
  if (state.kind === 'all') return true;
  if (state.kind === 'missable') return t.missable === true || t.oneOff === true;
  if (state.kind === 'online') return false;
  return Array.isArray(t.kind) && t.kind.includes(state.kind);
}

function gradeOrder(t) {
  return { platinum: 0, gold: 1, silver: 2, bronze: 3 }[t.grade] ?? 4;
}

function visibleTrophies() {
  const q = state.query.trim().toLowerCase();
  let list = trophies.filter((t) => {
    if (!kindMatches(t)) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.status === 'earned' && !state.earned.has(t.id)) return false;
    if (state.status === 'unearned' && state.earned.has(t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide} ${(t.kind || []).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  if (state.sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  else if (state.sort === 'grade') list = [...list].sort((a, b) => gradeOrder(a) - gradeOrder(b) || a.name.localeCompare(b.name));
  return list;
}

function gradeTag(t) {
  return `<span class="tag grade-${t.grade}">${t.grade}</span>`;
}

function metaTags(t) {
  const tags = [gradeTag(t)];
  if (t.missable) tags.push('<span class="tag missable">Missable</span>');
  else if (t.oneOff) tags.push('<span class="tag oneoff">One-off moment</span>');
  if (isSecret(t)) tags.push('<span class="tag secret">Hidden on PSN</span>');
  for (const k of t.kind || []) {
    if (k === 'story' || k === 'side') tags.push(`<span class="tag">${KIND_LABELS[k] || k}</span>`);
  }
  if (t.target) tags.push(`<span class="tag">Target: ${t.target}</span>`);
  return tags.join(' ');
}

function displayName(t) {
  return isHiddenFromReader(t) ? 'Hidden trophy' : t.name;
}

function displayDesc(t) {
  return isHiddenFromReader(t) ? 'Earn this trophy to reveal its name and description.' : t.description;
}

function renderProgress() {
  const earned = state.earned.size;
  const points = trophies.reduce((sum, t) => sum + (state.earned.has(t.id) ? t.points : 0), 0);
  $('earnedCount').textContent = String(earned);
  $('pointsLine').textContent = `${points.toLocaleString('en-US')} of ${TOTAL_POINTS.toLocaleString('en-US')} points`;
  const bar = $('progressBar');
  bar.setAttribute('aria-valuenow', String(earned));
  $('progressFill').style.width = `${(earned / trophies.length) * 100}%`;
}

function renderFacts() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) counts[t.grade] = (counts[t.grade] || 0) + 1;
  const hidden = trophies.filter(isSecret).length;
  $('facts').innerHTML = [
    ['Trophies', '55'],
    ['Platinum', String(counts.platinum)],
    ['Gold', String(counts.gold)],
    ['Silver', String(counts.silver)],
    ['Bronze', String(counts.bronze)],
    ['Hidden on PSN', String(hidden)],
    ['Online trophies', '0 — all offline'],
    ['Points', TOTAL_POINTS.toLocaleString('en-US')],
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}

function renderChips() {
  const chips = $('kindChips');
  chips.replaceChildren();
  for (const [key, label] of Object.entries(KIND_LABELS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    if (state.kind === key) b.classList.add('active');
    b.setAttribute('aria-pressed', state.kind === key ? 'true' : 'false');
    b.addEventListener('click', () => {
      state.kind = key;
      renderChips();
      renderView();
    });
    chips.append(b);
  }
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveState();
  renderProgress();
  renderView();
  if (state.openId === id) openDetail(id);
}

function cardElement(t) {
  const li = document.createElement('li');
  li.className = 'card' + (state.earned.has(t.id) ? ' earned' : '');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${displayName(t)} as earned`);
  box.addEventListener('change', () => toggleEarned(t.id));
  const body = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = displayName(t);
  const desc = document.createElement('div');
  desc.className = 'desc';
  desc.textContent = displayDesc(t);
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = metaTags(t);
  body.append(name, desc, meta);
  if (t.target && state.counts[t.id] != null) {
    const line = document.createElement('div');
    line.className = 'count-line';
    line.textContent = `Your count: ${state.counts[t.id]} of ${t.target}`;
    body.append(line);
  }
  const side = document.createElement('div');
  side.className = 'side';
  const points = document.createElement('div');
  points.className = 'points';
  points.textContent = `${t.points} pts`;
  const link = document.createElement('button');
  link.type = 'button';
  link.className = 'guide-link';
  link.textContent = isHiddenFromReader(t) ? 'Why hidden?' : 'Read the guide';
  link.addEventListener('click', () => openDetail(t.id));
  side.append(points, link);
  li.append(box, body, side);
  return li;
}

function renderChecklist() {
  const list = visibleTrophies();
  const earnedHere = list.filter((t) => state.earned.has(t.id)).length;
  viewEl.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'list-head';
  const h = document.createElement('h2');
  h.textContent = state.kind === 'online' ? 'Online trophies' : 'All 55 trophies';
  const p = document.createElement('p');
  p.textContent = `Showing ${list.length} of 55 · ${earnedHere} earned in this view`;
  head.append(h, p);
  viewEl.append(head);
  if (state.kind === 'online') {
    const note = document.createElement('p');
    note.className = 'empty';
    note.textContent = 'GTA VI has no online trophies: all 55 are offline, single-player, and the platinum needs no multiplayer or DLC. Source: PowerPyx trophy guide and roadmap.';
    viewEl.append(note);
    return;
  }
  if (!list.length) {
    const note = document.createElement('p');
    note.className = 'empty';
    note.textContent = 'No trophies match these filters. Clear the search or pick another kind.';
    viewEl.append(note);
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'cards';
  for (const t of list) ul.append(cardElement(t));
  viewEl.append(ul);
}

const ROADMAP = [
  {
    title: 'Stage 1 — Play the story, and meditate early',
    hours: '60–80 hours',
    body: 'Play Chapters 1–4 and the final mission in order. This earns the chapter trophies (Paradise Lost, T**s Ass Drug Money, Vice City, Baby!, Top Of The World, Ma), the mission trophies (Just Like Paradise, Trust, Break the Bank, Family Matters, DWNFALL, Hi-Jacked, Snow Storm) and the finale, You Gotta Know When to Get Off. There is no mission replay, so play carefully — but every story trophy here is automatic on completion, so none of them can be missed by failing a mission.',
    warn: 'Do the first meditation in Chapter 1, at Jason\u2019s house, the moment it is offered. PowerPyx flags Positive Mental Attitude as the only potentially missable trophy in the game, because that first meditation spot becomes permanently unavailable after Chapter 1. There are 18 meditation spots in 10 locations; do every one you pass.',
    items: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 28],
  },
  {
    title: 'Stage 2 — Finish every side strand',
    hours: 'As you go',
    body: 'Each named character has a final mission, and each one is a trophy: Andy (Road to Rehabilitation), Kenton (This Was No Boat Accident), Billy (The Lone Rider), Randy (Supply & Demand) and Tyrone (Spin On This!). Alongside them, complete 8 mission strands for strangers across Leonida for Strangers & Freaks, and hunt a unique animal for Bret (Fair Game) — a unique animal only exists once, so take the shot when you find it.',
    items: [22, 23, 24, 25, 26, 27, 29],
  },
  {
    title: 'Stage 3 — Explore, collect, and scan',
    hours: 'The long grind',
    body: 'Explore all of Leonida (The Goodtime State), discover 100 vehicles (Whip It Good), complete 3 Collectible Card sets (Don\u2019t Touch My Deck), meditate at every spot (Positive Mental Attitude) and WAiNK It at 100 locations (You WAiNKer!). PowerPyx notes the 100% checklist only needs 200 of 277 base-model vehicles scanned, so scanning as you travel pays twice.',
    items: [28, 30, 31, 35, 42],
  },
  {
    title: 'Stage 4 — Activities, challenges and combat',
    hours: 'Skill work',
    body: 'Try each type of activity once (Master of None), then work through the counters: 250 stunts (Cunning Stunts), gold in all Shooting Range challenges (The Shootist), 50 of the 80 challenges (One Last Thing), 20 different races won (Earn Cash, Not Kudos), drone races at every location (Top Fun), and the combat and robbery trophies — Gunslinger, Sneakthief, Maximum Withdrawal, A Classic Blitz Play and Pest Control. The tracker counts 9 activity types (Touchpad, then Progress, then Activities).',
    items: [15, 16, 17, 18, 19, 20, 21, 32, 33, 34, 36, 38, 39, 40, 41, 43],
  },
  {
    title: 'Stage 5 — Money, properties, and the 100%',
    hours: 'Cleanup',
    body: 'Launder $250,000 of Marked Bills (Dime on the Dollar), spend $100,000 across shops (Treat Yo Self), buy all garage properties (Little Boxes) and register 10 vehicles to the Scooter Bros app (On the Spot). Then finish the 100% Completion checklist (Progress, then Stats, then 100% Completion) for A Long Road — the gold PowerPyx calls the hardest trophy — and the platinum, Vice Got a Price!, unlocks with it. Keep cheats off for the whole run: PowerPyx reports cheats disable trophies and saving.',
    items: [14, 1, 52, 53, 54, 55],
  },
];

function renderRoadmap() {
  viewEl.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'list-head';
  const h = document.createElement('h2');
  h.textContent = 'Roadmap to the platinum';
  const p = document.createElement('p');
  p.textContent = 'PowerPyx rates the set 4/10 and about 200 hours, one playthrough, no online trophies. Built from the official descriptions plus the PowerPyx roadmap.';
  head.append(h, p);
  viewEl.append(head);
  for (const stage of ROADMAP) {
    const box = document.createElement('section');
    box.className = 'stage';
    const title = document.createElement('h3');
    title.textContent = stage.title;
    const hours = document.createElement('span');
    hours.className = 'hours';
    hours.textContent = stage.hours;
    title.append(hours);
    const body = document.createElement('p');
    body.textContent = stage.body;
    box.append(title, body);
    if (stage.warn) {
      const warn = document.createElement('p');
      warn.className = 'callout';
      warn.textContent = stage.warn;
      box.append(warn);
    }
    const list = document.createElement('ul');
    for (const id of stage.items) {
      const t = trophyById(id);
      if (!t) continue;
      const li = document.createElement('li');
      if (state.earned.has(id)) li.className = 'earned';
      li.textContent = `${state.earned.has(id) ? '✓ ' : ''}${t.name} — ${t.grade}, ${t.points} pts`;
      list.append(li);
    }
    box.append(list);
    viewEl.append(box);
  }
  const note = document.createElement('p');
  note.className = 'callout good';
  note.textContent = 'The platinum is Vice Got a Price! — it unlocks the moment the other 54 are earned. A Long Road (100% completion) is the last gate for most players, and most of its checklist is finished by doing the trophies above.';
  viewEl.append(note);
}

function renderMissables() {
  viewEl.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'list-head';
  const h = document.createElement('h2');
  h.textContent = 'Missable trophies';
  const p = document.createElement('p');
  p.textContent = 'Built from the official descriptions and PowerPyx\u2019s roadmap. There is no mission replay in GTA VI.';
  head.append(h, p);
  viewEl.append(head);
  const warn = document.createElement('p');
  warn.className = 'callout';
  warn.textContent = 'PowerPyx flags exactly one trophy as potentially missable: Positive Mental Attitude. Its first meditation, at Jason\u2019s house in Chapter 1, is offered once and becomes permanently unavailable after that chapter. Do it the moment it appears — every other meditation spot can be visited later.';
  viewEl.append(warn);
  const missable = trophies.filter((t) => t.missable);
  const ul = document.createElement('ul');
  ul.className = 'cards';
  for (const t of missable) ul.append(cardElement(t));
  viewEl.append(ul);
  const sub = document.createElement('h2');
  sub.textContent = 'One-off moments — do them when they appear';
  sub.style.marginTop = '26px';
  viewEl.append(sub);
  const explain = document.createElement('p');
  explain.className = 'prose';
  explain.textContent = 'These nine hidden trophies read like single scenes — a cocktail on Ocean Beach, a bowling alley, a showroom smash — and PowerPyx lists them as not yet pinned down, so nobody can promise they come back. They are not confirmed missable, but the safe play is to do each one the first time the moment shows up, rather than assuming a replay.';
  viewEl.append(explain);
  const oneOff = trophies.filter((t) => t.oneOff);
  const ul2 = document.createElement('ul');
  ul2.className = 'cards';
  for (const t of oneOff) ul2.append(cardElement(t));
  viewEl.append(ul2);
  const safe = document.createElement('p');
  safe.className = 'callout good';
  safe.textContent = 'Safe by design: every chapter and mission trophy is automatic on completion, all 55 trophies are offline single-player, and free-roam continues after the story — so nothing else in the list depends on a single unrepeatable attempt.';
  viewEl.append(safe);
}

function renderAbout() {
  viewEl.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'prose';
  const h = document.createElement('h2');
  h.textContent = 'Sources & about';
  const intro = document.createElement('p');
  intro.textContent = 'Every trophy name, description and grade in this guide is PlayStation\u2019s, as published on the official list and mirrored by Exophase and PSNProfiles — the two agree on all 55 names, descriptions and grades. The guides are written for this page in our own words; a guide may draw on other guides and cite them, and never copies their text.';
  const sh = document.createElement('h3');
  sh.textContent = 'Sources used';
  const list = document.createElement('ul');
  const sources = [
    ['Exophase — Grand Theft Auto VI trophies (PS5): the full official list, names, descriptions and grades.', 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/'],
    ['PSNProfiles — Grand Theft Auto VI trophies: the same list, plus PSN\u2019s progress counts (for example 42 Shooting Range challenges).', 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi'],
    ['PowerPyx — GTA 6 Trophy Guide & Roadmap: difficulty 4/10, about 200 hours, one playthrough, no mission replay, the one potentially missable trophy, cheats disabling trophies, and the 100% checklist details.', 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/'],
  ];
  for (const [text, url] of sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = url;
    a.textContent = text;
    a.rel = 'noopener';
    li.append(a);
    list.append(li);
  }
  const honest = document.createElement('h3');
  honest.textContent = 'What is not yet checked';
  const honestP = document.createElement('p');
  honestP.textContent = 'GTA VI released on 19 November 2026, the day this guide was built. Where a guide gives a specific place or step that has not yet been checked in the game, it says so in its own text and cites the official description it was built from. Locations and steps will firm up as players finish the game; the list itself — names, descriptions, grades — is already official.';
  const how = document.createElement('h3');
  how.textContent = 'How the tracker works';
  const howP = document.createElement('p');
  howP.textContent = 'Tick a trophy and it is saved in this browser (localStorage). Export downloads your progress as JSON; import reads that file back, or a plain list of trophy names. The spoiler switch hides the names and descriptions of hidden story trophies until you earn them. Counters (for example stunts, or WAiNK locations) live on each trophy\u2019s guide panel. Everything runs from these files, with the network off.';
  box.append(h, intro, sh, list, honest, honestP, how, howP);
  viewEl.append(box);
}

function renderView() {
  document.querySelectorAll('.tabs button').forEach((b) => {
    const active = b.dataset.view === state.view;
    b.classList.toggle('active', active);
    if (active) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  $('controls').style.display = state.view === 'checklist' ? '' : 'none';
  if (state.view === 'roadmap') renderRoadmap();
  else if (state.view === 'missables') renderMissables();
  else if (state.view === 'about') renderAbout();
  else renderChecklist();
  renderProgress();
}

function openDetail(id) {
  const t = trophyById(id);
  if (!t) return;
  state.openId = id;
  const hidden = isHiddenFromReader(t);
  detailEl.hidden = false;
  detailEl.innerHTML = '';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'close';
  close.textContent = 'Close ✕';
  close.addEventListener('click', () => {
    detailEl.hidden = true;
    state.openId = null;
  });
  const h = document.createElement('h2');
  h.textContent = displayName(t);
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = displayDesc(t);
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = metaTags(t);
  detailEl.append(close, h, desc, meta);
  const points = document.createElement('p');
  points.textContent = `${t.grade} · ${t.points} points · #${t.id} of 55`;
  detailEl.append(points);
  if (t.target) {
    const ch = document.createElement('h3');
    ch.textContent = 'Your count';
    const row = document.createElement('div');
    row.className = 'count-row';
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.value = state.counts[id] != null ? String(state.counts[id]) : '';
    input.setAttribute('aria-label', `Your count toward ${t.name}`);
    input.addEventListener('change', () => {
      const n = Number(input.value);
      if (Number.isFinite(n) && n >= 0) state.counts[id] = Math.floor(n);
      else delete state.counts[id];
      saveState();
      renderProgress();
    });
    const label = document.createElement('span');
    label.textContent = `of ${t.target} needed`;
    row.append(input, label);
    detailEl.append(ch, row);
  }
  const gh = document.createElement('h3');
  gh.textContent = 'Guide';
  const guide = document.createElement('div');
  guide.className = 'guide-text';
  if (hidden) {
    const p = document.createElement('p');
    p.textContent = 'This is a hidden story trophy. Its guide stays hidden until you earn it — turn the spoiler switch off, or tick the trophy, to read it.';
    guide.append(p);
  } else {
    for (const para of String(t.guide).split('\n')) {
      const p = document.createElement('p');
      p.textContent = para;
      guide.append(p);
    }
  }
  detailEl.append(gh, guide);
  const sh = document.createElement('h3');
  sh.textContent = 'Sources';
  const list = document.createElement('ul');
  list.className = 'sources';
  for (const s of t.sources || []) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.textContent = s.label;
    a.rel = 'noopener';
    li.append(a);
    list.append(li);
  }
  const own = document.createElement('li');
  own.textContent = 'Guide text: written for this page, in our own words, from the official description above.';
  list.append(own);
  detailEl.append(sh, list);
  const nh = document.createElement('h3');
  nh.textContent = 'Your note';
  const note = document.createElement('textarea');
  note.className = 'note-area';
  note.value = state.notes[id] || '';
  note.placeholder = 'Where you found it, what worked, what to try next…';
  note.setAttribute('aria-label', `Your note on ${t.name}`);
  note.addEventListener('change', () => {
    if (note.value.trim()) state.notes[id] = note.value;
    else delete state.notes[id];
    saveState();
  });
  const earn = document.createElement('button');
  earn.type = 'button';
  earn.className = 'earn-btn' + (state.earned.has(id) ? ' earned' : '');
  earn.textContent = state.earned.has(id) ? '✓ Earned — tick off' : 'Mark as earned';
  earn.addEventListener('click', () => toggleEarned(id));
  detailEl.append(nh, note, earn);
}

function exportProgress() {
  const payload = {
    app: 'leonida-platinum',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...state.earned],
    notes: state.notes,
    counts: state.counts,
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    const ids = new Set(trophies.map((t) => t.id));
    const names = new Map(trophies.map((t) => [t.name.toLowerCase(), t.id]));
    let earned = [];
    if (Array.isArray(data)) earned = data;
    else if (Array.isArray(data.earned)) earned = data.earned;
    else throw new Error('no earned list');
    const next = new Set();
    for (const item of earned) {
      if (typeof item === 'number' && ids.has(item)) next.add(item);
      else if (typeof item === 'string' && names.has(item.toLowerCase())) next.add(names.get(item.toLowerCase()));
    }
    state.earned = next;
    if (data.notes && typeof data.notes === 'object') state.notes = data.notes;
    if (data.counts && typeof data.counts === 'object') state.counts = data.counts;
    saveState();
    renderProgress();
    renderView();
    $('saveNote').textContent = `Imported ${next.size} earned trophies.`;
  } catch {
    $('saveNote').textContent = 'That file could not be imported — it is not a progress export from this guide.';
  }
}

function applyDemoParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('demo') !== '1') return;
  if (!localStorage.getItem(STORAGE_KEY)) {
    state.earned = new Set([2, 3, 4, 5, 8, 16, 20, 21, 33, 35, 42, 52, 53]);
    state.counts = { 15: 87, 31: 34, 35: 61 };
    saveState();
  }
  if (params.get('view') && ['checklist', 'roadmap', 'missables', 'about'].includes(params.get('view'))) {
    state.view = params.get('view');
  }
  if (params.get('spoilers') === 'on') state.spoilers = true;
  const open = Number(params.get('open'));
  if (open) state.openId = open;
}

async function boot() {
  loadState();
  const response = await fetch(DATA_URL);
  const data = await response.json();
  trophies = data.trophies || [];
  dataMeta = data;
  applyDemoParams();
  $('spoilerToggle').checked = state.spoilers;
  renderFacts();
  renderChips();
  renderView();
  if (state.openId) openDetail(state.openId);

  document.querySelectorAll('.tabs button').forEach((b) => {
    b.addEventListener('click', () => {
      state.view = b.dataset.view;
      renderView();
    });
  });
  $('searchBox').addEventListener('input', (e) => {
    state.query = e.target.value;
    renderView();
  });
  $('gradeFilter').addEventListener('change', (e) => {
    state.grade = e.target.value;
    renderView();
  });
  $('statusFilter').addEventListener('change', (e) => {
    state.status = e.target.value;
    renderView();
  });
  $('sortFilter').addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderView();
  });
  $('spoilerToggle').addEventListener('change', (e) => {
    state.spoilers = e.target.checked;
    saveState();
    renderView();
    if (state.openId) openDetail(state.openId);
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) importProgress(file);
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (!window.confirm('Clear every tick, note and counter?')) return;
    state.earned = new Set();
    state.notes = {};
    state.counts = {};
    saveState();
    renderProgress();
    renderView();
  });
}

boot();
