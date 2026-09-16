/* ===== 畫面切換與登入 ===== */

const loginScreen = document.getElementById('screen-login');
const welcomeScreen = document.getElementById('screen-welcome');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('toggle-password');
const welcomeName = document.getElementById('welcome-name');
const welcomeAvatar = document.getElementById('welcome-avatar');
const logoutButton = document.getElementById('logout');

function showScreen(next, current) {
  current.classList.add('screen--leaving');
  next.classList.add('screen--active');

  next.addEventListener('transitionend', function handler() {
    current.classList.remove('screen--active', 'screen--leaving');
    next.removeEventListener('transitionend', handler);
  });
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = usernameInput.value.trim() || '使用者';
  welcomeName.textContent = name;
  welcomeAvatar.textContent = name.charAt(0);
  showScreen(welcomeScreen, loginScreen);
});

logoutButton.addEventListener('click', () => {
  showScreen(loginScreen, welcomeScreen);
  passwordInput.value = '';
  usernameInput.focus();
});

togglePassword.addEventListener('click', () => {
  const showing = passwordInput.type === 'text';
  passwordInput.type = showing ? 'password' : 'text';
  togglePassword.setAttribute('aria-pressed', String(!showing));
  togglePassword.setAttribute('aria-label', showing ? '顯示密碼' : '隱藏密碼');
});

/* ===== 巴士到站查詢 ===== */

const busScreen = document.getElementById('screen-bus');
const busBack = document.getElementById('bus-back');
const busRoute = document.getElementById('bus-route');
const busSearch = document.getElementById('bus-search');
const busStatus = document.getElementById('bus-status');
const stopList = document.getElementById('bus-stops');
const segButtons = Array.from(document.querySelectorAll('.seg[data-bound]'));
const companyButtons = Array.from(document.querySelectorAll('.seg[data-company]'));
const tileBus = document.getElementById('tile-bus');
const tileFav = document.getElementById('tile-fav');
const favScreen = document.getElementById('screen-fav');
const favBack = document.getElementById('fav-back');
const favList = document.getElementById('fav-list');
const favEmpty = document.getElementById('fav-empty');

const KMB_BASE = 'https://data.etabus.gov.hk/v1/transport/kmb';
const CTB_BASE = 'https://rt.data.gov.hk/v2/transport/citybus';

const PROVIDERS = {
  kmb: {
    char: '九',
    name: '九巴',
    routeStop: (route, bound) =>
      `${KMB_BASE}/route-stop/${encodeURIComponent(route)}/${bound}/1`,
    stop: (stopId) => `${KMB_BASE}/stop/${stopId}`,
    eta: (stopId, route) =>
      `${KMB_BASE}/eta/${stopId}/${encodeURIComponent(route)}/1`,
    stopName: (data) => data.name_tc,
  },
  ctb: {
    char: '城',
    name: '城巴',
    routeStop: (route, bound) =>
      `${CTB_BASE}/route-stop/CTB/${encodeURIComponent(route)}/${bound}`,
    stop: (stopId) => `${CTB_BASE}/stop/${stopId}`,
    eta: (stopId, route) =>
      `${CTB_BASE}/eta/CTB/${stopId}/${encodeURIComponent(route)}`,
    stopName: (data) => data.name_tc,
    dirFilter: true,
  },
};

const FAV_KEY = 'kmb-fav-stops';
const STAR_SVG =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3Z"/></svg>';

const REFRESH_SVG =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>';

let favorites = loadFavorites();

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
}

function favKey(route, bound, stop, company) {
  return `${company || 'kmb'}|${route}|${bound}|${stop}`;
}

function isFav(item) {
  const key = favKey(currentRoute, currentBound, item.stop, currentCompany);
  return favorites.some((f) => f.key === key);
}

let currentCompany = 'kmb';
let currentBound = 'outbound';
let currentRoute = '';
let stops = [];
let searchToken = 0;
let etaToken = 0;

/* 遷移舊收藏（無 company 欄位） */
favorites.forEach((f) => { if (!f.company) f.company = 'kmb'; });
saveFavorites();

async function fetchJson(url, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url);
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
      continue;
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }
  throw new Error('HTTP 429');
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await fn(items[i], i);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

function boundLabel() {
  return currentBound === 'outbound' ? '出站' : '進站';
}

function setBound(bound) {
  currentBound = bound;
  segButtons.forEach((b) =>
    b.classList.toggle('seg--active', b.dataset.bound === bound)
  );
}

function setCompany(company) {
  currentCompany = company;
  companyButtons.forEach((b) =>
    b.classList.toggle('seg--active', b.dataset.company === company)
  );
}

segButtons.forEach((btn) => {
  btn.addEventListener('click', () => setBound(btn.dataset.bound));
});

companyButtons.forEach((btn) => {
  btn.addEventListener('click', () => setCompany(btn.dataset.company));
});

tileBus.addEventListener('click', () => showScreen(busScreen, welcomeScreen));
tileFav.addEventListener('click', () => {
  renderFavorites();
  showScreen(favScreen, welcomeScreen);
});
busBack.addEventListener('click', () => showScreen(welcomeScreen, busScreen));
favBack.addEventListener('click', () => showScreen(welcomeScreen, favScreen));
busRoute.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') runSearch();
});
busSearch.addEventListener('click', runSearch);

function setStatus(msg) {
  busStatus.textContent = msg;
  busStatus.hidden = !msg;
}

function renderStops() {
  stopList.innerHTML = '';
  stops.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'stop-row';

    const line = document.createElement('div');
    line.className = 'stop-line';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stop-item';

    const seq = document.createElement('span');
    seq.className = 'stop-seq';
    seq.textContent = item.seq;

    const name = document.createElement('span');
    name.className = 'stop-name stop-name--loading';
    name.dataset.nameFor = item.stop;
    name.textContent = '載入站名中…';

    btn.append(seq, name);
    btn.addEventListener('click', () => selectStop(item, btn));

    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'stop-fav';
    star.innerHTML = STAR_SVG;
    star.setAttribute('aria-label', '標記為常用站點');
    star.setAttribute('aria-pressed', String(isFav(item)));
    star.classList.toggle('stop-fav--active', isFav(item));
    star.addEventListener('click', () => toggleFav(item, star));

    line.append(btn, star);
    li.appendChild(line);
    stopList.appendChild(li);
  });
}

function toggleFav(item, star) {
  const key = favKey(currentRoute, currentBound, item.stop, currentCompany);
  const idx = favorites.findIndex((f) => f.key === key);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push({
      key,
      company: currentCompany,
      route: currentRoute,
      bound: currentBound,
      seq: item.seq,
      stop: item.stop,
      name: item.name,
    });
  }
  saveFavorites();
  const active = idx < 0;
  star.classList.toggle('stop-fav--active', active);
  star.setAttribute('aria-pressed', String(active));
}

function updateStopName(item) {
  const el = stopList.querySelector(`[data-name-for="${item.stop}"]`);
  if (!el) return;
  el.textContent = item.name || '（無站名）';
  el.classList.remove('stop-name--loading');
}

function buildEtaPanel(item) {
  const panel = document.createElement('div');
  panel.className = 'eta-card';

  const head = document.createElement('div');
  head.className = 'eta-head';

  const dest = document.createElement('p');
  dest.className = 'eta-dest';
  dest.textContent = '查詢到站時間中…';

  const refresh = document.createElement('button');
  refresh.type = 'button';
  refresh.className = 'icon-btn';
  refresh.setAttribute('aria-label', '重新整理');
  refresh.innerHTML = REFRESH_SVG;
  refresh.addEventListener('click', () => loadEta(item, panel));

  head.append(dest, refresh);

  const list = document.createElement('ul');
  list.className = 'eta-list';

  panel.append(head, list);
  return panel;
}

function selectStop(item, btn) {
  stopList.querySelectorAll('.stop-item').forEach((b) => {
    const nameEl = b.querySelector('.stop-name');
    b.classList.toggle('stop-item--selected', nameEl.dataset.nameFor === item.stop);
  });
  stopList.querySelectorAll('.eta-card').forEach((el) => el.remove());
  const panel = buildEtaPanel(item);
  btn.closest('li').appendChild(panel);
  loadEta(item, panel);
}

async function runSearch() {
  const route = busRoute.value.trim().toUpperCase();
  if (!route) {
    busRoute.focus();
    return;
  }
  currentRoute = route;
  stops = [];
  stopList.innerHTML = '';
  busSearch.disabled = true;

  const token = ++searchToken;
  setStatus('查詢中…');

  const prov = PROVIDERS[currentCompany];

  try {
    const routeStop = await fetchJson(prov.routeStop(route, currentBound));
    if (token !== searchToken) return;

    const ordered = (routeStop.data || []).slice().sort((a, b) => Number(a.seq) - Number(b.seq));
    if (!ordered.length) {
      setStatus('查無此路線或方向，請確認路線編號與方向。');
      return;
    }

    stops = ordered.map((s) => ({ seq: s.seq, stop: s.stop, name: null }));
    renderStops();
    setStatus(`共 ${stops.length} 站，載入站名中…`);

    await mapPool(stops, 6, async (item) => {
      const detail = await fetchJson(prov.stop(item.stop));
      if (token !== searchToken) return;
      item.name = prov.stopName(detail.data);
      updateStopName(item);
    });

    if (token !== searchToken) return;
    setStatus(`${prov.name} ${route}・${boundLabel()}・共 ${stops.length} 站，點選站點查看到站時間`);
  } catch (err) {
    if (token !== searchToken) return;
    setStatus('查詢失敗：' + err.message);
  } finally {
    if (token === searchToken) busSearch.disabled = false;
  }
}

async function loadEta(item, panel) {
  const dest = panel.querySelector('.eta-dest');
  const list = panel.querySelector('.eta-list');
  dest.textContent = '查詢到站時間中…';
  list.innerHTML = '';

  const prov = PROVIDERS[currentCompany];
  const token = ++etaToken;
  try {
    const eta = await fetchJson(prov.eta(item.stop, currentRoute));
    if (token !== etaToken) return;

    let rows = (eta.data || []).slice();
    /* 城巴 ETA 回傳雙向，需按 dir 過濾 */
    if (prov.dirFilter) {
      const dirChar = currentBound === 'outbound' ? 'O' : 'I';
      rows = rows.filter((r) => r.dir === dirChar);
    }
    /* 過濾掉已過期超過 1 分鐘的班次，以及超過 3 小時後的排程（通常是隔天班次） */
    const now = Date.now();
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    rows = rows.filter((r) => {
      const t = new Date(r.eta).getTime();
      return t > now - 60000 && t < now + THREE_HOURS;
    });
    rows.sort((a, b) => new Date(a.eta) - new Date(b.eta));
    if (!rows.length) {
      dest.textContent = '';
      const li = document.createElement('li');
      li.className = 'eta-empty';
      li.textContent = '目前無到站預報';
      list.appendChild(li);
      return;
    }

    dest.textContent = '往 ' + rows[0].dest_tc;
    rows.forEach((row) => {
      const time = new Date(row.eta);
      const hh = String(time.getHours()).padStart(2, '0');
      const mm = String(time.getMinutes()).padStart(2, '0');
      const mins = Math.round((time - Date.now()) / 60000);
      const minLabel = mins <= 0 ? '即將到站' : mins + ' 分鐘後';

      const li = document.createElement('li');
      li.className = 'eta-item';

      const left = document.createElement('span');
      const t = document.createElement('span');
      t.className = 'eta-time';
      t.textContent = `${hh}:${mm}`;
      const m = document.createElement('span');
      m.className = 'eta-min';
      m.textContent = minLabel;
      left.append(t, m);

      const rmk = document.createElement('span');
      rmk.className = 'eta-rmk';
      rmk.textContent = row.rmk_tc || '';

      li.append(left, rmk);
      list.appendChild(li);
    });
  } catch (err) {
    if (token !== etaToken) return;
    dest.textContent = '到站時間查詢失敗：' + err.message;
  }
}

/* ===== 常用站點 ===== */

async function loadFavEta(fav, el) {
  const prov = PROVIDERS[fav.company] || PROVIDERS.kmb;
  try {
    const eta = await fetchJson(prov.eta(fav.stop, fav.route));
    let rows = (eta.data || []).slice();
    if (prov.dirFilter) {
      const dirChar = fav.bound === 'outbound' ? 'O' : 'I';
      rows = rows.filter((r) => r.dir === dirChar);
    }
    const nowFav = Date.now();
    const THREE_H = 3 * 60 * 60 * 1000;
    const upcoming = rows
      .map((row) => new Date(row.eta))
      .filter((t) => {
        const ms = t.getTime();
        return ms > nowFav - 60000 && ms < nowFav + THREE_H;
      })
      .sort((a, b) => a - b);
    if (!upcoming.length) {
      el.textContent = '目前無到站預報';
      el.classList.add('fav-eta--empty');
      return;
    }
    const next = upcoming[0];
    const mins = Math.round((next - Date.now()) / 60000);
    const hh = String(next.getHours()).padStart(2, '0');
    const mm = String(next.getMinutes()).padStart(2, '0');
    el.textContent = `${hh}:${mm}・${mins <= 0 ? '即將到站' : mins + ' 分鐘後'}`;
  } catch {
    el.textContent = '—';
    el.classList.add('fav-eta--empty');
  }
}

function renderFavorites() {
  favList.innerHTML = '';
  favEmpty.hidden = favorites.length > 0;
  const etaTargets = [];
  favorites.forEach((fav) => {
    const li = document.createElement('li');
    li.className = 'stop-row';

    const line = document.createElement('div');
    line.className = 'stop-line';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stop-item';

    const company = document.createElement('span');
    company.className = `fav-company fav-company--${fav.company || 'kmb'}`;
    company.textContent = PROVIDERS[fav.company]?.char || '九';

    const route = document.createElement('span');
    route.className = 'fav-route';
    route.textContent = fav.route;

    const name = document.createElement('span');
    name.className = 'stop-name';
    name.textContent = `${fav.name || '（無站名）'}・${fav.bound === 'outbound' ? '出站' : '進站'}`;

    const eta = document.createElement('span');
    eta.className = 'fav-eta';
    eta.textContent = '更新中…';

    btn.append(company, route, name, eta);
    btn.addEventListener('click', () => openFavorite(fav));

    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'stop-fav stop-fav--active';
    star.innerHTML = STAR_SVG;
    star.setAttribute('aria-label', '移除常用站點');
    star.setAttribute('aria-pressed', 'true');
    star.addEventListener('click', () => {
      favorites = favorites.filter((f) => f.key !== fav.key);
      saveFavorites();
      renderFavorites();
    });

    line.append(btn, star);
    li.appendChild(line);
    favList.appendChild(li);
    etaTargets.push({ fav, eta });
  });
  mapPool(etaTargets, 4, (target) => loadFavEta(target.fav, target.eta));
}

async function openFavorite(fav) {
  showScreen(busScreen, favScreen);
  setCompany(fav.company || 'kmb');
  busRoute.value = fav.route;
  setBound(fav.bound);
  await runSearch();
  const nameEl = stopList.querySelector(`.stop-name[data-name-for="${fav.stop}"]`);
  if (!nameEl) return;
  const item = stops.find((s) => s.stop === fav.stop);
  const btn = nameEl.closest('.stop-item');
  if (item && btn) selectStop(item, btn);
}
